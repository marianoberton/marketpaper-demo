import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Listar todos los tickets (solo super admin)
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

    // Verificar que es super admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      )
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const company_id = searchParams.get('company_id')
    const category_id = searchParams.get('category_id')
    const source = searchParams.get('source')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const offset = (page - 1) * limit

    // Construir query
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        category:ticket_categories(id, name, color, icon),
        company:companies(id, name, slug),
        user:user_profiles!support_tickets_user_id_fkey(id, full_name, email, avatar_url),
        messages:ticket_messages(count)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Aplicar filtros
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority)
    }
    if (company_id) {
      query = query.eq('company_id', company_id)
    }
    if (category_id) {
      query = query.eq('category_id', category_id)
    }
    if (source) {
      query = query.eq('source', source)
    }
    if (search) {
      query = query.or(`subject.ilike.%${search}%,description.ilike.%${search}%,external_email.ilike.%${search}%,external_name.ilike.%${search}%`)
    }

    const { data: tickets, error, count } = await query

    if (error) {
      console.error('Error fetching admin tickets:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener tickets' },
        { status: 500 }
      )
    }

    // Obtener estadísticas rápidas
    const { data: stats } = await supabase
      .from('support_tickets')
      .select('status, priority')

    const statsData = {
      total: stats?.length || 0,
      open: stats?.filter(t => t.status === 'open').length || 0,
      in_progress: stats?.filter(t => t.status === 'in_progress').length || 0,
      waiting_user: stats?.filter(t => t.status === 'waiting_user').length || 0,
      resolved: stats?.filter(t => t.status === 'resolved').length || 0,
      closed: stats?.filter(t => t.status === 'closed').length || 0,
      urgent: stats?.filter(t => t.priority === 'urgent' && !['resolved', 'closed'].includes(t.status)).length || 0,
      high: stats?.filter(t => t.priority === 'high' && !['resolved', 'closed'].includes(t.status)).length || 0
    }

    return NextResponse.json({
      success: true,
      tickets,
      stats: statsData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Admin Tickets API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET stats endpoint
export async function HEAD(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new NextResponse(null, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return new NextResponse(null, { status: 403 })
    }

    // Contar tickets pendientes
    const { count } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress'])

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Pending-Tickets': String(count || 0)
      }
    })

  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
