import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener la compañía del usuario
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'Usuario sin compañía asignada' }, { status: 400 })
    }

    // Obtener etapas de proyecto de la compañía
    const { data: stages, error } = await supabase
      .from('project_stages')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .order('order')

    if (error) {
      console.error('Error fetching project stages:', error)
      return NextResponse.json({ error: 'Error al cargar etapas de proyecto' }, { status: 500 })
    }

    return NextResponse.json({ stages })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 