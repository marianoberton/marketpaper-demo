import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID requerido' },
        { status: 400 }
      )
    }

    // Obtener usuario actual
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar acceso al proyecto (excepto super admin)
    if (currentUser.role !== 'super_admin') {
      const { data: project } = await supabase
        .from('projects')
        .select('company_id')
        .eq('id', projectId)
        .single()
      
      if (!project || project.company_id !== currentUser.company_id) {
        return NextResponse.json({ error: 'Sin permisos para ver este proyecto' }, { status: 403 })
      }
    }

    // Obtener etapas completadas usando la función de la base de datos
    const { data: completedStages, error } = await supabase
      .rpc('get_project_completed_stages', { p_project_id: projectId })

    if (error) {
      console.error('Error fetching completed stages:', error)
      return NextResponse.json({ error: 'Error al obtener etapas completadas' }, { status: 500 })
    }

    return NextResponse.json({ completedStages: completedStages || [] })

  } catch (error) {
    console.error('Error in GET /api/workspace/construction/stage-completions:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener usuario actual
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, stageName, completed } = body

    if (!projectId || !stageName || typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: projectId, stageName, completed' },
        { status: 400 }
      )
    }

    // Verificar acceso al proyecto (excepto super admin)
    if (currentUser.role !== 'super_admin') {
      const { data: project } = await supabase
        .from('projects')
        .select('company_id')
        .eq('id', projectId)
        .single()
      
      if (!project || project.company_id !== currentUser.company_id) {
        return NextResponse.json({ error: 'Sin permisos para modificar este proyecto' }, { status: 403 })
      }
    }

    // Usar la función toggle_stage_completion para manejar el estado
    const { data: result, error } = await supabase
      .rpc('toggle_stage_completion', {
        p_project_id: projectId,
        p_stage_name: stageName,
        p_completed: completed,
        p_user_id: currentUser.id
      })

    if (error) {
      console.error('Error toggling stage completion:', error)
      return NextResponse.json({ error: 'Error al actualizar estado de etapa' }, { status: 500 })
    }

    // Obtener las etapas completadas actualizadas
    const { data: completedStages, error: fetchError } = await supabase
      .rpc('get_project_completed_stages', { p_project_id: projectId })

    if (fetchError) {
      console.error('Error fetching updated completed stages:', fetchError)
      return NextResponse.json({ error: 'Error al obtener etapas actualizadas' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      completedStages: completedStages || [],
      message: completed ? 'Etapa marcada como completada' : 'Etapa desmarcada como completada'
    })

  } catch (error) {
    console.error('Error in POST /api/workspace/construction/stage-completions:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}