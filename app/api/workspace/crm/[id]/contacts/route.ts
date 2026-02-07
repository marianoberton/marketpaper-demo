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

    const { id: clientId } = await params
    const supabase = await createClient()

    // Verify client exists and belongs to user's company
    const { data: client } = await supabase
      .from('clients')
      .select('company_id')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Empresa cliente no encontrada' }, { status: 404 })
    }

    if (currentUser.role !== 'super_admin' && client.company_id !== currentUser.company_id) {
      return NextResponse.json({ error: 'No tiene permisos' }, { status: 403 })
    }

    const { data: contacts, error } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('client_id', clientId)
      .order('is_primary', { ascending: false })
      .order('first_name')

    if (error) {
      console.error('Error fetching contacts:', error)
      return NextResponse.json({ error: 'Error al cargar contactos' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: contacts || [] })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: clientId } = await params
    const body = await request.json()
    const supabase = await createClient()

    // Verify client exists and get company_id
    const { data: client } = await supabase
      .from('clients')
      .select('company_id')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Empresa cliente no encontrada' }, { status: 404 })
    }

    if (currentUser.role !== 'super_admin' && client.company_id !== currentUser.company_id) {
      return NextResponse.json({ error: 'No tiene permisos' }, { status: 403 })
    }

    if (!body.first_name?.trim() || !body.last_name?.trim()) {
      return NextResponse.json({ error: 'Nombre y apellido son requeridos' }, { status: 400 })
    }

    const contactData: Record<string, unknown> = {
      company_id: client.company_id,
      client_id: clientId,
      first_name: body.first_name.trim(),
      last_name: body.last_name.trim(),
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      position: body.position?.trim() || null,
      is_primary: body.is_primary || false,
      notes: body.notes?.trim() || null,
      source: body.source?.trim() || null,
      photo_url: body.photo_url?.trim() || null,
    }
    if (Array.isArray(body.tags)) {
      contactData.tags = body.tags
    }

    const { data: contact, error } = await supabase
      .from('crm_contacts')
      .insert(contactData)
      .select()
      .single()

    if (error) {
      console.error('Error creating contact:', error)
      return NextResponse.json({ error: 'Error al crear contacto' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: contact }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
