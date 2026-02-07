import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Returns module overrides for a specific user
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

  const searchParams = new URL(request.url).searchParams
  const targetUserId = searchParams.get('user_id')

  if (!targetUserId) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  const companyId = profile.role === 'super_admin'
    ? searchParams.get('company_id') || profile.company_id
    : profile.company_id

  if (!companyId) return NextResponse.json({ error: 'company_id requerido' }, { status: 400 })

  try {
    const { data: overrides, error } = await supabase
      .from('user_module_overrides')
      .select('module_id, override_type')
      .eq('user_id', targetUserId)
      .eq('company_id', companyId)

    if (error) throw error

    return NextResponse.json({
      overrides: overrides || [],
    })
  } catch (error: any) {
    console.error('[USER_MODULES] Error:', error.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// PUT - Save module overrides for a specific user
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
    const { user_id: targetUserId, overrides } = body as {
      user_id: string
      overrides: { module_id: string; override_type: 'grant' | 'revoke' }[]
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
    }

    // Verify target user belongs to same company
    const { data: targetProfile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', targetUserId)
      .single()

    if (!targetProfile || targetProfile.company_id !== companyId) {
      return NextResponse.json({ error: 'Usuario no pertenece a esta empresa' }, { status: 403 })
    }

    // Delete all existing overrides for this user in this company
    const { error: deleteError } = await supabase
      .from('user_module_overrides')
      .delete()
      .eq('user_id', targetUserId)
      .eq('company_id', companyId)

    if (deleteError) throw deleteError

    // Insert new overrides
    if (overrides && overrides.length > 0) {
      const rows = overrides.map(o => ({
        user_id: targetUserId,
        module_id: o.module_id,
        override_type: o.override_type,
        company_id: companyId,
        created_by: user.id,
      }))

      const { error: insertError } = await supabase
        .from('user_module_overrides')
        .insert(rows)

      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[USER_MODULES] Error:', error.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
