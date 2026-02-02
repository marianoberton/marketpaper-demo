import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { encryptCredentials, decryptCredentials, maskSecret, PROVIDER_SCHEMAS, PROVIDER_LABELS } from '@/lib/encryption'

// Types
interface Integration {
  id: string
  company_id: string
  provider: string
  name: string
  environment: string
  config: Record<string, any>
  is_active: boolean
  last_used_at: string | null
  last_verified_at: string | null
  verification_status: string
  created_at: string
  updated_at: string
}

interface CreateIntegrationBody {
  provider: string
  name: string
  credentials: Record<string, string>
  environment?: string
  config?: Record<string, any>
}

interface IntegrationContext {
  params: Promise<{ id: string }>
}

// Check if user is super_admin
async function requireSuperAdmin(supabase: any): Promise<{ userId: string } | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return null
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    return null
  }

  return { userId: user.id }
}

// Log audit event
async function logAudit(
  supabase: any,
  integrationId: string,
  action: string,
  userId: string,
  metadata: Record<string, any> = {}
) {
  try {
    await supabase.from('company_integrations_audit').insert({
      integration_id: integrationId,
      action,
      performed_by: userId,
      metadata
    })
  } catch (error) {
    console.error('[Audit] Failed to log:', error)
  }
}

/**
 * GET /api/admin/companies/[id]/integrations
 * List all integrations for a company (without decrypted credentials)
 */
export async function GET(
  request: NextRequest,
  context: IntegrationContext
) {
  try {
    const supabase = await createClient()
    const auth = await requireSuperAdmin(supabase)
    
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      )
    }

    const { id: companyId } = await context.params

    const { data: integrations, error } = await supabase
      .from('company_integrations')
      .select(`
        id,
        company_id,
        provider,
        name,
        environment,
        config,
        is_active,
        last_used_at,
        last_verified_at,
        verification_status,
        created_at,
        updated_at
      `)
      .eq('company_id', companyId)
      .order('provider')
      .order('name')

    if (error) {
      console.error('[Integrations GET] Error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Add provider labels
    const integrationsWithLabels = (integrations || []).map((int: Integration) => ({
      ...int,
      provider_label: PROVIDER_LABELS[int.provider] || int.provider
    }))

    return NextResponse.json({
      success: true,
      integrations: integrationsWithLabels,
      providers: PROVIDER_LABELS
    })

  } catch (error) {
    console.error('[Integrations GET] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/companies/[id]/integrations
 * Create a new integration with encrypted credentials
 */
export async function POST(
  request: NextRequest,
  context: IntegrationContext
) {
  try {
    const supabase = await createClient()
    const auth = await requireSuperAdmin(supabase)
    
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      )
    }

    const { id: companyId } = await context.params
    const body: CreateIntegrationBody = await request.json()

    // Validate required fields
    if (!body.provider || !body.name || !body.credentials) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: provider, name, credentials' },
        { status: 400 }
      )
    }

    // Validate provider
    const schema = PROVIDER_SCHEMAS[body.provider]
    if (!schema) {
      return NextResponse.json(
        { success: false, error: `Unknown provider: ${body.provider}. Valid providers: ${Object.keys(PROVIDER_SCHEMAS).join(', ')}` },
        { status: 400 }
      )
    }

    // Validate required credential fields
    for (const field of schema.fields) {
      if (!body.credentials[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required credential field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Encrypt credentials
    const { encrypted, iv } = encryptCredentials(body.credentials)

    // Insert integration
    const { data: integration, error } = await supabase
      .from('company_integrations')
      .insert({
        company_id: companyId,
        provider: body.provider,
        name: body.name,
        encrypted_credentials: encrypted,
        credentials_iv: iv,
        environment: body.environment || 'production',
        config: body.config || {},
        created_by: auth.userId,
        updated_by: auth.userId
      })
      .select(`
        id,
        company_id,
        provider,
        name,
        environment,
        config,
        is_active,
        verification_status,
        created_at
      `)
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { success: false, error: `Integration "${body.name}" for ${body.provider} already exists` },
          { status: 409 }
        )
      }
      console.error('[Integrations POST] Error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Log audit
    await logAudit(supabase, integration.id, 'created', auth.userId, {
      provider: body.provider,
      environment: body.environment
    })

    return NextResponse.json({
      success: true,
      integration: {
        ...integration,
        provider_label: PROVIDER_LABELS[integration.provider] || integration.provider
      }
    }, { status: 201 })

  } catch (error) {
    console.error('[Integrations POST] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/companies/[id]/integrations
 * Update an integration (rotate key, update config, toggle active)
 */
export async function PATCH(
  request: NextRequest,
  context: IntegrationContext
) {
  try {
    const supabase = await createClient()
    const auth = await requireSuperAdmin(supabase)
    
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { integrationId, ...updates } = body

    if (!integrationId) {
      return NextResponse.json(
        { success: false, error: 'Missing integrationId' },
        { status: 400 }
      )
    }

    const updateData: Record<string, any> = {
      updated_by: auth.userId
    }

    // Handle credential rotation
    if (updates.credentials) {
      const { encrypted, iv } = encryptCredentials(updates.credentials)
      updateData.encrypted_credentials = encrypted
      updateData.credentials_iv = iv
      updateData.verification_status = 'pending'
    }

    // Handle other updates
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.environment !== undefined) updateData.environment = updates.environment
    if (updates.config !== undefined) updateData.config = updates.config
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active

    const { data: integration, error } = await supabase
      .from('company_integrations')
      .update(updateData)
      .eq('id', integrationId)
      .select(`
        id,
        provider,
        name,
        environment,
        config,
        is_active,
        verification_status,
        updated_at
      `)
      .single()

    if (error) {
      console.error('[Integrations PATCH] Error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Log audit
    const action = updates.credentials ? 'rotated' : 'updated'
    await logAudit(supabase, integrationId, action, auth.userId, {
      fields_updated: Object.keys(updates)
    })

    return NextResponse.json({
      success: true,
      integration: {
        ...integration,
        provider_label: PROVIDER_LABELS[integration.provider] || integration.provider
      }
    })

  } catch (error) {
    console.error('[Integrations PATCH] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/companies/[id]/integrations
 * Delete an integration
 */
export async function DELETE(
  request: NextRequest,
  context: IntegrationContext
) {
  try {
    const supabase = await createClient()
    const auth = await requireSuperAdmin(supabase)
    
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const integrationId = searchParams.get('integrationId')

    if (!integrationId) {
      return NextResponse.json(
        { success: false, error: 'Missing integrationId query parameter' },
        { status: 400 }
      )
    }

    // Get integration info for audit before deleting
    const { data: integration } = await supabase
      .from('company_integrations')
      .select('provider, name')
      .eq('id', integrationId)
      .single()

    const { error } = await supabase
      .from('company_integrations')
      .delete()
      .eq('id', integrationId)

    if (error) {
      console.error('[Integrations DELETE] Error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Log audit (integration record is deleted, so we log with null integration_id)
    // Actually, audit records should cascade delete, but we can log to a separate place
    console.log(`[Audit] Integration deleted: ${integration?.provider}/${integration?.name} by ${auth.userId}`)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[Integrations DELETE] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
