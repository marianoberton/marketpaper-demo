import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
        },
      }
    )

    // Verify user is authenticated and is a super admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a super admin
    const { data: superAdmin, error: superAdminError } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (superAdminError || !superAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if requesting a specific company
    const companyId = new URL(request.url).searchParams.get('id')

    if (companyId) {
      // Fetch single company with full details including modules
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select(`
          *,
          client_templates!template_id (
            id,
            name,
            description,
            category,
            max_users,
            max_contacts,
            max_api_calls,
            monthly_price
          )
        `)
        .eq('id', companyId)
        .single()

      if (companyError) {
        console.error('Error fetching company:', companyError)
        return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 })
      }

      // Fetch modules for this company's template
      let modules = []
      if (company.template_id) {
        const { data: templateModules, error: modulesError } = await supabase
          .from('template_modules')
          .select(`
            modules (
              id,
              name,
              route_path,
              icon,
              category,
              description,
              display_order,
              is_core,
              allowed_roles,
              requires_integration
            )
          `)
          .eq('template_id', company.template_id)
          .order('modules(display_order)', { ascending: true })

        if (!modulesError && templateModules) {
          modules = templateModules.map(tm => tm.modules).filter(Boolean)
        }
      }

      return NextResponse.json({
        ...company,
        template_id: company.template_id,
        template: company.client_templates,
        modules
      })
    }

    // Fetch all companies with their template information (list view)
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(`
        *,
        client_templates!template_id (
          name,
          category
        )
      `)
      .order('created_at', { ascending: false })

    if (companiesError) {
      console.error('Error fetching companies:', companiesError)
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
    }

    // Transform the data to match the expected format
    const transformedCompanies = companies?.map(company => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
      contact_email: company.contact_email,
      contact_phone: company.contact_phone,
      domain: company.domain,
      plan: company.plan,
      status: company.status,
      monthly_price: company.monthly_price,
      max_users: company.max_users,
      max_contacts: company.max_contacts,
      created_at: company.created_at,
      trial_ends_at: company.trial_ends_at,
      current_users: company.current_users || 0,
      client_template_id: company.template_id,
      template_name: company.client_templates?.name || null
    })) || []

    return NextResponse.json(transformedCompanies)

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: superAdmin, error: superAdminError } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (superAdminError || !superAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const companyId = new URL(request.url).searchParams.get('id')
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    const requestBody = await request.json()
    const { client_template_id, template_id, status, ...otherUpdates } = requestBody

    // Prepare update data
    const updateData: any = { ...otherUpdates }

    // Handle template ID mapping (frontend can send either client_template_id or template_id)
    if (client_template_id !== undefined) {
      updateData.template_id = client_template_id || null
    } else if (template_id !== undefined) {
      updateData.template_id = template_id || null
    }

    // Handle status updates
    if (status !== undefined) {
      updateData.status = status
      updateData.updated_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', companyId)
      .select(`
        *,
        client_templates!template_id (
          name,
          category
        )
      `)
      .single()

    if (error) {
      console.error('Error updating company:', error)
      return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
    }

    // Transform response to match frontend expectations
    const transformedData = {
      ...data,
      client_template_id: data.template_id,
      template_name: data.client_templates?.name || null
    }

    // Revalidar el workspace de esta empresa para que recargue los módulos actualizados
    revalidatePath(`/workspace`)
    revalidatePath(`/workspace/[slug]`, 'page')

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('API PUT Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 