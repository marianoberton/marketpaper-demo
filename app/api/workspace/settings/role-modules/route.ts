import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Returns the role-module matrix for a company
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  if (!['super_admin', 'company_owner', 'company_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const companyId = profile.role === 'super_admin'
    ? new URL(request.url).searchParams.get('company_id') || profile.company_id
    : profile.company_id

  if (!companyId) return NextResponse.json({ error: 'company_id requerido' }, { status: 400 })

  try {
    // Get all role-module mappings for this company
    const { data: roleModulesRaw, error: rmError } = await supabase
      .from('company_role_modules')
      .select('role, module_id')
      .eq('company_id', companyId)

    if (rmError) throw rmError

    // Group by role
    const roleModules: Record<string, string[]> = {}
    const roles = ['company_owner', 'company_admin', 'manager', 'employee', 'viewer']
    roles.forEach(r => { roleModules[r] = [] })

    if (roleModulesRaw) {
      for (const rm of roleModulesRaw) {
        if (!roleModules[rm.role]) roleModules[rm.role] = []
        roleModules[rm.role].push(rm.module_id)
      }
    }

    // Get company modules for reference
    const { data: company } = await supabase
      .from('companies')
      .select('template_id, features')
      .eq('id', companyId)
      .single()

    let companyModules: any[] = []

    if (company?.template_id) {
      const { data: templateModules } = await supabase
        .from('template_modules')
        .select('modules (*)')
        .eq('template_id', company.template_id)

      if (templateModules) {
        companyModules = templateModules
          .map(tm => (tm as any).modules)
          .filter(Boolean)
      }
    }

    if (companyModules.length === 0) {
      const { data: allModules } = await supabase
        .from('modules')
        .select('*')
        .order('display_order')

      companyModules = allModules || []
    }

    return NextResponse.json({
      roleModules,
      companyModules,
      isCustomized: (roleModulesRaw?.length || 0) > 0,
    })
  } catch (error: any) {
    console.error('[ROLE_MODULES] Error:', error.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// PUT - Save the role-module matrix for a company
export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  if (!['super_admin', 'company_owner', 'company_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const companyId = profile.role === 'super_admin'
    ? new URL(request.url).searchParams.get('company_id') || profile.company_id
    : profile.company_id

  if (!companyId) return NextResponse.json({ error: 'company_id requerido' }, { status: 400 })

  try {
    const body = await request.json()
    const { roleModules } = body as { roleModules: Record<string, string[]> }

    if (!roleModules) {
      return NextResponse.json({ error: 'roleModules requerido' }, { status: 400 })
    }

    // Delete all existing role-module mappings for this company
    const { error: deleteError } = await supabase
      .from('company_role_modules')
      .delete()
      .eq('company_id', companyId)

    if (deleteError) throw deleteError

    // Insert new mappings
    const rows: { company_id: string; role: string; module_id: string; created_by: string }[] = []

    for (const [role, moduleIds] of Object.entries(roleModules)) {
      for (const moduleId of moduleIds) {
        rows.push({
          company_id: companyId,
          role,
          module_id: moduleId,
          created_by: user.id,
        })
      }
    }

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from('company_role_modules')
        .insert(rows)

      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true, count: rows.length })
  } catch (error: any) {
    console.error('[ROLE_MODULES] Error:', error.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
