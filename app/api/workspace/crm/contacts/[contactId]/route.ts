import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { contactId } = await params
    const body = await request.json()
    const supabase = await createClient()

    // Verify contact exists and check access
    const { data: existing } = await supabase
      .from('crm_contacts')
      .select('company_id')
      .eq('id', contactId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 })
    }

    if (currentUser.role !== 'super_admin' && existing.company_id !== currentUser.company_id) {
      return NextResponse.json({ error: 'No tiene permisos' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    const allowedFields = ['first_name', 'last_name', 'email', 'phone', 'position', 'is_primary', 'notes', 'source', 'photo_url']
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'is_primary') {
          updateData[field] = body[field]
        } else {
          updateData[field] = body[field]?.trim() || null
        }
      }
    }
    if (body.tags !== undefined) {
      updateData.tags = Array.isArray(body.tags) ? body.tags : []
    }

    const { data: contact, error } = await supabase
      .from('crm_contacts')
      .update(updateData)
      .eq('id', contactId)
      .select()
      .single()

    if (error) {
      console.error('Error updating contact:', error)
      return NextResponse.json({ error: 'Error al actualizar contacto' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: contact })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { contactId } = await params
    const supabase = await createClient()

    // Verify contact exists and check access
    const { data: existing } = await supabase
      .from('crm_contacts')
      .select('company_id')
      .eq('id', contactId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 })
    }

    if (currentUser.role !== 'super_admin' && existing.company_id !== currentUser.company_id) {
      return NextResponse.json({ error: 'No tiene permisos' }, { status: 403 })
    }

    const { error } = await supabase
      .from('crm_contacts')
      .delete()
      .eq('id', contactId)

    if (error) {
      console.error('Error deleting contact:', error)
      return NextResponse.json({ error: 'Error al eliminar contacto' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Contacto eliminado' })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
