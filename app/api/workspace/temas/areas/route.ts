import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Listar áreas
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    let query = supabase
      .from('tema_areas')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (profile?.role !== 'super_admin' && profile?.company_id) {
      query = query.eq('company_id', profile.company_id)
    }

    const { data: areas, error } = await query

    if (error) {
      console.error('Error fetching areas:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener áreas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      areas
    })

  } catch (error) {
    console.error('Areas API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear área
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id && profile?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Sin empresa asignada' },
        { status: 403 }
      )
    }

    if (!['admin', 'owner', 'super_admin'].includes(profile?.role || '')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para crear áreas' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, color, icon } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const { data: area, error: createError } = await supabase
      .from('tema_areas')
      .insert({
        company_id: profile.company_id,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#6366F1',
        icon: icon || 'building'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating area:', createError)
      return NextResponse.json(
        { success: false, error: 'Error al crear el área' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      area
    }, { status: 201 })

  } catch (error) {
    console.error('Create Area API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
