import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createSupabaseAdmin } from '@/lib/supabase'

interface ClientTemplate {
  id?: string
  name: string
  description?: string
  category: string
  dashboard_config?: Record<string, any>
  workspace_config?: Record<string, any>
  available_features?: string[]
  default_permissions?: Record<string, any>
  max_users: number
  max_contacts: number
  max_api_calls: number
  monthly_price: number
  setup_fee: number
  is_active: boolean
  dashboard_modules?: string[]
  workspace_modules?: string[]
}

export async function GET() {
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
    const supabaseAdmin = createSupabaseAdmin()

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

    // Fetch templates
    const { data: templates, error: templatesError } = await supabaseAdmin
      .from('client_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (templatesError) {
      console.error('Error fetching templates:', templatesError)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    // Fetch all available modules
    const { data: modules, error: modulesError } = await supabaseAdmin
      .from('modules')
      .select('*')
      .order('category')
      .order('name');

    if (modulesError) {
      console.error('Error fetching modules:', modulesError)
      return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 })
    }

    // Fetch module assignments for all templates
    const templateIds = templates?.map(t => t.id) || []
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('template_modules')
      .select('template_id, module_id')
      .in('template_id', templateIds);

    if (assignmentsError) {
      console.error('Error fetching template_modules:', assignmentsError);
      return NextResponse.json({ error: 'Failed to fetch module assignments' }, { status: 500 });
    }

    // Transform templates to match frontend interface
    const transformedTemplates = templates?.map(template => {
      const assignedModuleIds = assignments
        .filter(a => a.template_id === template.id)
        .map(a => a.module_id);
      
      const assignedModules = modules?.filter(m => assignedModuleIds.includes(m.id)) || [];

      return {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        monthly_price: template.monthly_price,
        setup_fee: template.setup_fee,
        is_active: template.is_active,
        created_at: template.created_at,
        // Legacy features
        dashboard_modules: template.available_features?.filter((f: string) => 
          ['overview', 'analytics', 'sales', 'marketing', 'crm', 'financial', 'technical', 'team'].includes(f)
        ) || [],
        workspace_modules: template.available_features?.filter((f: string) => 
          ['crm', 'projects', 'calendar', 'documents', 'team', 'analytics', 'bots', 'knowledge', 'expenses', 'settings'].includes(f)
        ) || [],
        // New dynamic modules
        modules: assignedModuleIds,
        max_users: template.max_users,
        max_contacts: template.max_contacts,
        max_api_calls: template.max_api_calls
      }
    }) || []

    return NextResponse.json({
      templates: transformedTemplates,
      availableModules: modules,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Hack to handle module creation within the same route
  if (request.headers.get('X-Action') === 'Create-Module') {
    return POST_MODULE(request);
  }

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
    const supabaseAdmin = createSupabaseAdmin()

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

    const templateData: ClientTemplate = await request.json()

    // Combine dashboard and workspace modules into available_features
    const allFeatures = [
      ...(templateData.dashboard_modules || []),
      ...(templateData.workspace_modules || [])
    ]

    // Create template in Supabase
    const { data: template, error: templateError } = await supabaseAdmin
      .from('client_templates')
      .insert([{
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        dashboard_config: {
          enabled_modules: templateData.dashboard_modules || []
        },
        workspace_config: {
          enabled_modules: templateData.workspace_modules || []
        },
        available_features: allFeatures,
        default_permissions: {},
        max_users: templateData.max_users,
        max_contacts: templateData.max_contacts,
        max_api_calls: templateData.max_api_calls,
        monthly_price: templateData.monthly_price,
        setup_fee: templateData.setup_fee,
        is_active: templateData.is_active,
        created_by: superAdmin.id
      }])
      .select()
      .single()

    if (templateError) {
      console.error('Error creating template:', templateError)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    // Transform response to match frontend interface
    const transformedTemplate = {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      monthly_price: template.monthly_price,
      setup_fee: template.setup_fee,
      is_active: template.is_active,
      created_at: template.created_at,
      dashboard_modules: templateData.dashboard_modules || [],
      workspace_modules: templateData.workspace_modules || [],
      max_users: template.max_users,
      max_contacts: template.max_contacts,
      max_api_calls: template.max_api_calls
    }

    return NextResponse.json(transformedTemplate, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handler para crear un módulo.
async function POST_MODULE(request: NextRequest) {
    const supabaseAdmin = createSupabaseAdmin()
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
    
  try {
    const { name, route_path, icon, category } = await request.json()

    if (!name || !route_path || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('modules')
      .insert([{ name, route_path, icon, category }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error creating module:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
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
    const supabaseAdmin = createSupabaseAdmin()

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

    const templateData: any = await request.json()
    const templateId = new URL(request.url).searchParams.get('id')

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    // Combine legacy and new modules
    const allFeatures = [
      ...(templateData.dashboard_modules || []),
      ...(templateData.workspace_modules || [])
    ]
    
    // Update template details
    const { data: template, error: templateError } = await supabaseAdmin
      .from('client_templates')
      .update({
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        max_users: templateData.max_users,
        max_contacts: templateData.max_contacts,
        max_api_calls: templateData.max_api_calls,
        monthly_price: templateData.monthly_price,
        setup_fee: templateData.setup_fee,
        is_active: templateData.is_active,
        available_features: allFeatures,
      })
      .eq('id', templateId)
      .select()
      .single()

    if (templateError) {
      console.error('Error updating template:', templateError)
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }

    // --- New Module Assignment Logic ---
    const moduleIds = templateData.modules || []

    // 1. Delete existing assignments for this template
    const { error: deleteError } = await supabaseAdmin
      .from('template_modules')
      .delete()
      .eq('template_id', templateId)

    if (deleteError) {
      console.error('Error deleting module assignments:', deleteError)
      return NextResponse.json({ error: 'Failed to update module assignments' }, { status: 500 })
    }

    // 2. Insert new assignments if there are any
    if (moduleIds.length > 0) {
      const newAssignments = moduleIds.map((moduleId: string) => ({
        template_id: templateId,
        module_id: moduleId,
      }))

      const { error: insertError } = await supabaseAdmin
        .from('template_modules')
        .insert(newAssignments)

      if (insertError) {
        console.error('Error inserting new module assignments:', insertError)
        return NextResponse.json({ error: 'Failed to update module assignments' }, { status: 500 })
      }
    }
    // --- End New Logic ---


    // Transform response
    const transformedTemplate = {
      ...template,
      dashboard_modules: allFeatures.filter((f: string) => 
        ['overview', 'analytics', 'sales', 'marketing', 'crm', 'financial', 'technical', 'team'].includes(f)
      ),
      workspace_modules: allFeatures.filter((f: string) => 
        ['crm', 'projects', 'calendar', 'documents', 'team', 'analytics', 'bots', 'knowledge', 'expenses', 'settings'].includes(f)
      ),
      modules: moduleIds
    }

    return NextResponse.json(transformedTemplate)
  } catch (error) {
    console.error('Error in PUT /api/admin/templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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
    const supabaseAdmin = createSupabaseAdmin()

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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    // Delete template from Supabase
    const { error: deleteError } = await supabaseAdmin
      .from('client_templates')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting template:', deleteError)
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 