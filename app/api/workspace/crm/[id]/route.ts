import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()

    // Fetch client
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !client) {
      return NextResponse.json({ error: 'Empresa cliente no encontrada' }, { status: 404 })
    }

    // Verify company access
    if (currentUser.role !== 'super_admin' && client.company_id !== currentUser.company_id) {
      return NextResponse.json({ error: 'No tiene permisos' }, { status: 403 })
    }

    // Fetch contacts and temas in parallel
    const [contactsResult, temasResult] = await Promise.allSettled([
      supabase
        .from('crm_contacts')
        .select('*')
        .eq('client_id', id)
        .order('is_primary', { ascending: false })
        .order('first_name'),
      supabase
        .from('temas')
        .select('id, title, status, priority, reference_code, due_date, created_at')
        .eq('client_id', id)
        .eq('company_id', client.company_id)
        .order('created_at', { ascending: false })
    ])

    const contacts = contactsResult.status === 'fulfilled' ? contactsResult.value.data : []
    const temas = temasResult.status === 'fulfilled' ? temasResult.value.data : []

    return NextResponse.json({
      success: true,
      data: {
        ...client,
        contacts: contacts || [],
        temas: temas || []
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const supabase = await createClient()

    // Verify client exists and check access
    const { data: existing } = await supabase
      .from('clients')
      .select('company_id')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Empresa cliente no encontrada' }, { status: 404 })
    }

    if (currentUser.role !== 'super_admin' && existing.company_id !== currentUser.company_id) {
      return NextResponse.json({ error: 'No tiene permisos' }, { status: 403 })
    }

    if (body.name !== undefined && !body.name?.trim()) {
      return NextResponse.json({ error: 'El nombre no puede estar vacío' }, { status: 400 })
    }

    // Build update object
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    const allowedFields = ['name', 'email', 'phone', 'address', 'cuit', 'website_url', 'notes', 'source']
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]?.trim() || null
      }
    }
    if (body.tags !== undefined) {
      updateData.tags = Array.isArray(body.tags) ? body.tags : []
    }

    const { data: client, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating client:', error)
      return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: client })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()

    // Verify client exists and check access
    const { data: existing } = await supabase
      .from('clients')
      .select('company_id')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Empresa cliente no encontrada' }, { status: 404 })
    }

    if (currentUser.role !== 'super_admin' && existing.company_id !== currentUser.company_id) {
      return NextResponse.json({ error: 'No tiene permisos' }, { status: 403 })
    }

    // Check for associated projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('client_id', id)
      .limit(1)

    if (projects && projects.length > 0) {
      return NextResponse.json({
        error: 'No se puede eliminar la empresa porque tiene proyectos asociados'
      }, { status: 400 })
    }

    // Delete contacts first (cascade should handle this, but be explicit)
    await supabase
      .from('crm_contacts')
      .delete()
      .eq('client_id', id)

    // Delete client
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting client:', error)
      return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Empresa eliminada exitosamente' })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
