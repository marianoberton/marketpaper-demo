import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Listar temas del workspace
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener perfil del usuario con mejor manejo de errores
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, company_id, role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile in GET:', profileError)
      return NextResponse.json(
        { success: false, error: 'Error al obtener perfil', debug: profileError.message },
        { status: 500 }
      )
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const type_id = searchParams.get('type_id')
    const assignee_id = searchParams.get('assignee_id')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Determine company_id - super_admin may not have one assigned
    let targetCompanyId: string | null = profile?.company_id || null

    if (!targetCompanyId) {
      if (profile?.role === 'super_admin') {
        // Super admin without company - try to get company_id from request or first company
        const requestCompanyId = searchParams.get('company_id')
        
        if (requestCompanyId) {
          targetCompanyId = requestCompanyId
        } else {
          // Get first available company
          const { data: companies } = await supabase
            .from('companies')
            .select('id')
            .limit(1)
          
          if (companies && companies.length > 0) {
            targetCompanyId = companies[0].id
          }
        }
      }
      
      if (!targetCompanyId) {
        return NextResponse.json(
          { success: false, error: 'Sin empresa asignada' },
          { status: 403 }
        )
      }
    }

    // Construir query
    let query = supabase
      .from('temas')
      .select(`
        *,
        type:tema_types(id, name, color, icon),
        created_by_user:user_profiles!temas_created_by_fkey(id, full_name, email),
        assignees:tema_assignees(
          id,
          role,
          user:user_profiles!tema_assignees_user_id_fkey(id, full_name, email, avatar_url)
        )
      `, { count: 'exact' })
      .eq('company_id', targetCompanyId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }
    if (type_id) {
      query = query.eq('type_id', type_id)
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,reference_code.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: temas, error, count } = await query

    if (error) {
      console.error('Error fetching temas:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener temas' },
        { status: 500 }
      )
    }

    // Si hay filtro por asignado, filtrar en memoria (Supabase no soporta filtro en relación anidada)
    let filteredTemas = temas
    if (assignee_id && temas) {
      filteredTemas = temas.filter(tema => 
        tema.assignees?.some((a: any) => a.user?.id === assignee_id)
      )
    }

    // Obtener estadísticas
    const { data: stats } = await supabase
      .from('temas')
      .select('status')
      .eq('company_id', profile.company_id!)

    const statusCounts = stats?.reduce((acc: Record<string, number>, tema) => {
      acc[tema.status] = (acc[tema.status] || 0) + 1
      return acc
    }, {}) || {}

    return NextResponse.json({
      success: true,
      temas: filteredTemas,
      stats: statusCounts,
      pagination: {
        page,
        limit,
        total: assignee_id ? filteredTemas?.length || 0 : count || 0,
        totalPages: Math.ceil((assignee_id ? filteredTemas?.length || 0 : count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Temas API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo tema
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener perfil del usuario - con mejor manejo de errores
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, company_id, role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile in POST:', profileError)
      return NextResponse.json(
        { success: false, error: 'Error al obtener perfil de usuario', debug: profileError.message },
        { status: 500 }
      )
    }

    // Permission check: only owner, admin, manager can create temas
    if (!['super_admin', 'company_owner', 'company_admin', 'manager'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para crear temas' },
        { status: 403 }
      )
    }

    // Determine company_id - super_admin may not have one assigned
    let targetCompanyId: string | null = profile?.company_id || null

    if (!targetCompanyId) {
      if (profile?.role === 'super_admin') {
        // Super admin without company - try to get company_id from request or first company
        const { searchParams } = new URL(request.url)
        const requestCompanyId = searchParams.get('company_id')
        
        if (requestCompanyId) {
          targetCompanyId = requestCompanyId
        } else {
          // Get first available company
          const { data: companies } = await supabase
            .from('companies')
            .select('id')
            .limit(1)
          
          if (companies && companies.length > 0) {
            targetCompanyId = companies[0].id
          }
        }
      }
      
      if (!targetCompanyId) {
        return NextResponse.json(
          { success: false, error: 'Sin empresa asignada' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { 
      title, 
      description, 
      reference_code,
      type_id, 
      area_id,
      expediente_number,
      organismo,
      status, 
      priority, 
      due_date,
      notes,
      assignee_ids, // Array de user IDs
      lead_assignee_id,
      client_id,
      project_id,
      depends_on_tema_id,
      sequential_order,
      tasks_from_template // Array of task objects from template
    } = body

    // Validaciones
    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'El título es requerido' },
        { status: 400 }
      )
    }

    // Build insert object - base fields only
    const insertData: Record<string, any> = {
      company_id: targetCompanyId,
      title: title.trim(),
      description: description?.trim() || null,
      reference_code: reference_code?.trim() || null,
      type_id: type_id || null,
      status: status || 'nuevo_expediente',
      priority: priority || 'media',
      due_date: due_date || null,
      notes: notes?.trim() || null,
      created_by: user.id,
      started_at: new Date().toISOString()
    }

    // Add Phase 2/3 fields only if they have values (avoids errors if columns don't exist yet)
    if (area_id) insertData.area_id = area_id
    if (expediente_number) insertData.expediente_number = expediente_number.trim()
    if (organismo) insertData.organismo = organismo
    if (client_id) insertData.client_id = client_id
    if (project_id) insertData.project_id = project_id
    if (depends_on_tema_id) insertData.depends_on_tema_id = depends_on_tema_id
    if (sequential_order !== undefined) insertData.sequential_order = sequential_order

    // Crear el tema
    const { data: tema, error: createError } = await supabase
      .from('temas')
      .insert(insertData)
      .select()
      .single()

    if (createError) {
      console.error('Error creating tema:', createError)
      return NextResponse.json(
        { success: false, error: 'Error al crear el tema', debug: createError.message },
        { status: 500 }
      )
    }

    // Asignar responsables si se proporcionaron
    if (assignee_ids?.length > 0) {
      const assigneeRecords = assignee_ids.map((userId: string) => ({
        tema_id: tema.id,
        user_id: userId,
        role: 'responsable',
        is_lead: lead_assignee_id === userId,
        assigned_by: user.id
      }))

      await supabase
        .from('tema_assignees')
        .insert(assigneeRecords)
    }

    // Crear tareas desde template si se proporcionaron
    if (tasks_from_template?.length > 0) {
      const taskRecords = tasks_from_template.map((t: any, index: number) => ({
        tema_id: tema.id,
        title: t.titulo || t.title,
        description: t.descripcion || t.description || null,
        task_type: t.tipo || t.task_type || null,
        assigned_to: t.assigned_to || null,
        due_date: t.due_date || null,
        checklist: (t.checklist || []).map((item: string, i: number) => ({
          id: `${Date.now()}-${i}`,
          label: item,
          checked: false
        })),
        sort_order: t.orden || index + 1,
        created_by: user.id
      }))

      await supabase
        .from('tema_tasks')
        .insert(taskRecords)
    }

    // Registrar actividad de creación
    await supabase
      .from('tema_activity')
      .insert({
        tema_id: tema.id,
        user_id: user.id,
        action: 'created',
        new_value: title
      })

    // Obtener el tema completo con relaciones
    const { data: fullTema } = await supabase
      .from('temas')
      .select(`
        *,
        type:tema_types(id, name, color, icon),
        assignees:tema_assignees(
          id,
          role,
          user:user_profiles!tema_assignees_user_id_fkey(id, full_name, email)
        )
      `)
      .eq('id', tema.id)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Tema creado exitosamente',
      tema: fullTema
    }, { status: 201 })

  } catch (error) {
    console.error('Create Tema API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
