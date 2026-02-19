import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Tareas pendientes del cliente agrupadas por cliente
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

    if (!profile?.company_id && profile?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Sin empresa asignada' },
        { status: 403 }
      )
    }

    const companyId = profile.company_id

    // Fetch tasks waiting on client with full context
    const { data: tasks, error } = await supabase
      .from('tema_tasks')
      .select(`
        id, title, status, created_at, due_date,
        tema:temas!inner(
          id, title, company_id, project_id,
          client:clients(id, name, email, phone),
          project:tema_projects(id, name, address)
        )
      `)
      .eq('task_type', 'esperando_cliente')
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching pending client tasks:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener tareas pendientes' },
        { status: 500 }
      )
    }

    // Filter to company
    const companyTasks = (tasks || []).filter((t: any) => t.tema?.company_id === companyId)

    // Group by client -> project -> tasks
    const clientMap: Record<string, {
      client: any
      projects: Record<string, { project: any; tasks: any[] }>
      total_pending: number
    }> = {}

    const now = Date.now()

    companyTasks.forEach((task: any) => {
      const client = task.tema?.client
      // Skip temas without an assigned client — not relevant for client reports
      if (!client) return

      const project = task.tema?.project
      const clientId = client.id
      const projectId = project?.id || 'sin_proyecto'

      if (!clientMap[clientId]) {
        clientMap[clientId] = {
          client,
          projects: {},
          total_pending: 0,
        }
      }

      if (!clientMap[clientId].projects[projectId]) {
        clientMap[clientId].projects[projectId] = {
          project: project || { id: 'sin_proyecto', name: 'Sin proyecto' },
          tasks: [],
        }
      }

      const daysWaiting = Math.floor((now - new Date(task.created_at).getTime()) / 86400000)

      clientMap[clientId].projects[projectId].tasks.push({
        id: task.id,
        title: task.title,
        tema_id: task.tema?.id,
        tema_title: task.tema?.title,
        created_at: task.created_at,
        due_date: task.due_date,
        days_waiting: daysWaiting,
      })
      clientMap[clientId].total_pending++
    })

    // Convert to array sorted by total_pending desc
    const clients = Object.values(clientMap)
      .map((entry) => ({
        client: entry.client,
        projects: Object.values(entry.projects),
        total_pending: entry.total_pending,
      }))
      .sort((a, b) => b.total_pending - a.total_pending)

    return NextResponse.json({
      success: true,
      clients,
      summary: {
        total_clients: clients.length,
        total_tasks: companyTasks.length,
      },
    })
  } catch (error) {
    console.error('Pendiente Cliente API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
