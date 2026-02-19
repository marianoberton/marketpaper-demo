import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Dashboard ejecutivo de temas
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

    // Run parallel queries
    const [
      projectsResult,
      temasResult,
      tasksResult,
      waitingClientResult,
      overdueByPersonResult,
    ] = await Promise.allSettled([
      // 1. Projects by status/gerencia
      supabase
        .from('tema_projects')
        .select('id, status, gerencia')
        .eq('company_id', companyId),

      // 2. Temas with status and due_date
      supabase
        .from('temas')
        .select('id, status, priority, due_date, project_id, depends_on_tema_id')
        .eq('company_id', companyId),

      // 3. All active tasks
      supabase
        .from('tema_tasks')
        .select('id, status, due_date, task_type, assigned_to, tema_id')
        .in('status', ['pending', 'in_progress']),

      // 4. Tasks waiting on client
      supabase
        .from('tema_tasks')
        .select(`
          id, title, status, created_at, due_date,
          tema:temas!inner(id, title, company_id, project_id,
            project:tema_projects(id, name),
            client:clients(id, name)
          )
        `)
        .eq('task_type', 'esperando_cliente')
        .in('status', ['pending', 'in_progress']),

      // 5. Overdue tasks by person
      supabase
        .from('tema_tasks')
        .select(`
          id, due_date, assigned_to,
          assigned_user:user_profiles!tema_tasks_assigned_to_fkey(id, full_name, avatar_url),
          tema:temas!inner(company_id)
        `)
        .in('status', ['pending', 'in_progress'])
        .not('due_date', 'is', null)
        .lt('due_date', new Date().toISOString().split('T')[0]),
    ])

    const projects = projectsResult.status === 'fulfilled' ? projectsResult.value.data || [] : []
    const temas = temasResult.status === 'fulfilled' ? temasResult.value.data || [] : []
    const allTasks = tasksResult.status === 'fulfilled' ? tasksResult.value.data || [] : []
    const waitingClientTasks = waitingClientResult.status === 'fulfilled' ? waitingClientResult.value.data || [] : []
    const overdueTasksRaw = overdueByPersonResult.status === 'fulfilled' ? overdueByPersonResult.value.data || [] : []

    // Filter to company
    const companyWaitingTasks = waitingClientTasks.filter((t: any) => t.tema?.company_id === companyId)
    const companyOverdueTasks = overdueTasksRaw.filter((t: any) => t.tema?.company_id === companyId)

    // Calculate stats
    const activeProjects = projects.filter((p: any) => p.status !== 'completado').length
    const completedStatuses = ['completado', 'finalizado']
    const activeTemas = temas.filter((t: any) => !completedStatuses.includes(t.status)).length

    const today = new Date().toISOString().split('T')[0]
    const overdueTemas = temas.filter((t: any) =>
      t.due_date && t.due_date < today && !completedStatuses.includes(t.status)
    )

    // Filter tasks to only company temas
    const temaIds = new Set(temas.map((t: any) => t.id))
    const companyTasks = allTasks.filter((t: any) => temaIds.has(t.tema_id))
    const overdueTasks = companyTasks.filter((t: any) => t.due_date && t.due_date < today)

    // Gerencia breakdown
    const projectsByGerencia: Record<string, any[]> = {}
    projects.forEach((p: any) => {
      const g = p.gerencia || 'sin_gerencia'
      if (!projectsByGerencia[g]) projectsByGerencia[g] = []
      projectsByGerencia[g].push(p)
    })

    const projectIdsByGerencia: Record<string, Set<string>> = {}
    Object.entries(projectsByGerencia).forEach(([g, projs]) => {
      projectIdsByGerencia[g] = new Set(projs.map((p: any) => p.id))
    })

    const byGerencia: Record<string, any> = {}
    for (const g of ['construccion', 'licitaciones']) {
      const gProjects = projectsByGerencia[g] || []
      const gProjectIds = projectIdsByGerencia[g] || new Set()
      const gTemas = temas.filter((t: any) => gProjectIds.has(t.project_id))
      const gActiveTemas = gTemas.filter((t: any) => !completedStatuses.includes(t.status))
      const gTemaIds = new Set(gTemas.map((t: any) => t.id))
      const gOverdueTasks = overdueTasks.filter((t: any) => gTemaIds.has(t.tema_id))
      const gObservados = gTemas.filter((t: any) => t.status === 'observado')

      byGerencia[g] = {
        projects: gProjects.filter((p: any) => p.status !== 'completado').length,
        temas: gActiveTemas.length,
        overdue_tasks: gOverdueTasks.length,
        observados: gObservados.length,
      }
    }

    // Alerts
    const alerts: any[] = []

    // Overdue temas
    overdueTemas.slice(0, 5).forEach((t: any) => {
      const daysOverdue = Math.floor((Date.now() - new Date(t.due_date).getTime()) / 86400000)
      alerts.push({
        type: 'overdue_tema',
        tema_id: t.id,
        title: t.title || `Tema ${t.id.slice(0, 8)}`,
        days_overdue: daysOverdue,
      })
    })

    // Long-waiting client tasks (> 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    companyWaitingTasks
      .filter((t: any) => t.created_at < sevenDaysAgo)
      .slice(0, 5)
      .forEach((t: any) => {
        const daysWaiting = Math.floor((Date.now() - new Date(t.created_at).getTime()) / 86400000)
        alerts.push({
          type: 'long_waiting_client',
          task_id: t.id,
          title: t.title,
          days_waiting: daysWaiting,
          client_name: t.tema?.client?.name || null,
          tema_title: t.tema?.title || null,
        })
      })

    // Overdue by person
    const personMap: Record<string, { full_name: string; avatar_url: string | null; count: number }> = {}
    companyOverdueTasks.forEach((t: any) => {
      const uid = t.assigned_to
      if (!uid) return
      if (!personMap[uid]) {
        personMap[uid] = {
          full_name: t.assigned_user?.full_name || 'Sin asignar',
          avatar_url: t.assigned_user?.avatar_url || null,
          count: 0,
        }
      }
      personMap[uid].count++
    })
    const overdueByPerson = Object.entries(personMap)
      .map(([user_id, data]) => ({ user_id, ...data }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      success: true,
      stats: {
        active_projects: activeProjects,
        active_temas: activeTemas,
        overdue_tasks: overdueTasks.length,
        waiting_on_client: companyWaitingTasks.length,
      },
      by_gerencia: byGerencia,
      alerts,
      overdue_by_person: overdueByPerson,
    })
  } catch (error) {
    console.error('Dashboard API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
