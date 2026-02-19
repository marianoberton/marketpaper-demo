import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Listar proyectos del workspace
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
      .select('id, company_id, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Perfil no encontrado' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const companyId = profile.role === 'super_admin'
      ? searchParams.get('company_id') || profile.company_id
      : profile.company_id

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Sin empresa asignada' },
        { status: 403 }
      )
    }

    const status = searchParams.get('status')
    const gerencia = searchParams.get('gerencia')
    const search = searchParams.get('search')

    let query = supabase
      .from('tema_projects')
      .select(`
        *,
        client:clients(id, name, cuit),
        responsible:user_profiles!tema_projects_responsible_id_fkey(id, full_name, avatar_url),
        created_by_user:user_profiles!tema_projects_created_by_fkey(id, full_name)
      `)
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (gerencia) query = query.eq('gerencia', gerencia)
    if (search) query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`)

    const { data: projects, error } = await query

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener proyectos' },
        { status: 500 }
      )
    }

    // Get tema counts per project
    const projectIds = projects?.map(p => p.id) || []
    let projectStats: Record<string, { total: number; completed: number; overdue_tasks: number }> = {}

    if (projectIds.length > 0) {
      const { data: temas } = await supabase
        .from('temas')
        .select('id, project_id, status')
        .in('project_id', projectIds)

      const { data: tasks } = await supabase
        .from('tema_tasks')
        .select('id, status, due_date, tema_id')
        .in('tema_id', temas?.map(t => t.id) || [])

      const now = new Date().toISOString().split('T')[0]

      for (const pid of projectIds) {
        const projectTemas = temas?.filter(t => t.project_id === pid) || []
        const temaIds = projectTemas.map(t => t.id)
        const projectTasks = tasks?.filter(t => temaIds.includes(t.tema_id)) || []

        projectStats[pid] = {
          total: projectTemas.length,
          completed: projectTemas.filter(t => t.status === 'completado' || t.status === 'finalizado').length,
          overdue_tasks: projectTasks.filter(t =>
            t.status !== 'completed' && t.due_date && t.due_date < now
          ).length
        }
      }
    }

    const enrichedProjects = projects?.map(p => ({
      ...p,
      stats: projectStats[p.id] || { total: 0, completed: 0, overdue_tasks: 0 }
    }))

    return NextResponse.json({
      success: true,
      projects: enrichedProjects
    })

  } catch (error) {
    console.error('Projects API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo proyecto
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
      .select('id, company_id, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Perfil no encontrado' },
        { status: 403 }
      )
    }

    // Permission check: only owner, admin, manager can create projects
    if (!['super_admin', 'company_owner', 'company_admin', 'manager'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para crear proyectos' },
        { status: 403 }
      )
    }

    const companyId = profile.role === 'super_admin'
      ? new URL(request.url).searchParams.get('company_id') || profile.company_id
      : profile.company_id

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Sin empresa asignada' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      client_id,
      address,
      gerencia,
      status,
      responsible_id,
      start_date,
      estimated_end_date,
      priority,
      notes
    } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const { data: project, error: createError } = await supabase
      .from('tema_projects')
      .insert({
        company_id: companyId,
        name: name.trim(),
        client_id: client_id || null,
        address: address?.trim() || null,
        gerencia: gerencia || null,
        status: status || 'nuevo',
        responsible_id: responsible_id || null,
        start_date: start_date || null,
        estimated_end_date: estimated_end_date || null,
        priority: priority || 'media',
        notes: notes?.trim() || null,
        created_by: user.id
      })
      .select(`
        *,
        client:clients(id, name, cuit),
        responsible:user_profiles!tema_projects_responsible_id_fkey(id, full_name, avatar_url)
      `)
      .single()

    if (createError) {
      console.error('Error creating project:', createError)
      return NextResponse.json(
        { success: false, error: 'Error al crear el proyecto', debug: createError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Proyecto creado exitosamente',
      project
    }, { status: 201 })

  } catch (error) {
    console.error('Create Project API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
