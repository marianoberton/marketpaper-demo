import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Obtener el usuario actual
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Determinar el company_id a usar
    let targetCompanyId: string

    if (currentUser.role === 'super_admin') {
      const companyId = searchParams.get('company_id')
      if (companyId) {
        targetCompanyId = companyId
      } else {
        const { data: companies } = await supabase.from('companies').select('id').limit(1)
        if (companies && companies.length > 0) {
          targetCompanyId = companies[0].id
        } else {
          return NextResponse.json({ error: 'No se encontró una compañía' }, { status: 400 })
        }
      }
    } else {
      if (!currentUser.company_id) {
        return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 400 })
      }
      targetCompanyId = currentUser.company_id
    }

    // 1. Obtener CLIENTES (Módulo Construcción)
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', targetCompanyId)

    if (clientsError) {
      console.error('Error fetching clients:', clientsError)
      return NextResponse.json({ error: 'Error al cargar clientes' }, { status: 500 })
    }

    // 2. Obtener LEADS (Módulo CRM) - Usamos contact_leads por ahora
    const { data: leads, error: leadsError } = await supabase
      .from('contact_leads')
      .select('*')
      .eq('company_id', targetCompanyId)

    if (leadsError) {
      // Si la tabla no existe o falla, no bloqueamos, solo logueamos
      console.warn('Error fetching leads:', leadsError)
    }

    // 3. Unificar datos
    const unifiedContacts = []

    // Mapear Clients a CrmContact
    if (clients) {
      clients.forEach(client => {
        unifiedContacts.push({
          id: client.id,
          type: 'client',
          name: client.name,
          email: client.email,
          phone: client.phone,
          company_name: client.name, // En construcción, el cliente suele ser la entidad
          position: client.contact_person, // Usamos contact_person como cargo/contacto
          status: 'client', // Estado fijo para clientes existentes
          lead_score: 100, // Clientes ya convertidos tienen score máximo
          source: 'construction',
          created_at: client.created_at,
          last_interaction: client.updated_at
        })
      })
    }

    // Mapear Leads a CrmContact
    if (leads) {
      leads.forEach(lead => {
        unifiedContacts.push({
          id: lead.id,
          type: 'lead',
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company_name: lead.company,
          position: null, // contact_leads no tiene cargo explícito a veces
          status: lead.status || 'new',
          lead_score: lead.lead_score || 0,
          source: lead.source || 'web',
          created_at: lead.submitted_at || lead.created_at,
          last_interaction: lead.last_contacted_at || lead.created_at
        })
      })
    }

    // Ordenar por fecha de creación (más reciente primero)
    unifiedContacts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({ contacts: unifiedContacts })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { type, name, email, phone, company_name, position, notes } = body

    // Validación básica
    if (!name) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    // Determinar company_id
    let targetCompanyId = currentUser.company_id
    if (!targetCompanyId && currentUser.role === 'super_admin') {
      // Si es super admin y no tiene company_id, intentar obtener del body o usar la primera disponible
      // Por simplicidad para este caso de uso, requerimos que se pase o se tenga
      if (body.company_id) {
        targetCompanyId = body.company_id
      }
    }

    if (!targetCompanyId) {
      return NextResponse.json({ error: 'Company ID no determinado' }, { status: 400 })
    }

    let result;

    if (type === 'client') {
      // Insertar en CLIENTES (Construcción)
      // Mapeo: name -> name (Entidad), contact_person -> position/name (si es persona)
      // Si company_name existe, lo usamos como name (Entidad), y name como contact_person
      // Si no, usamos name como name (Entidad)
      
      const clientData = {
        company_id: targetCompanyId,
        name: company_name || name, // Preferimos nombre de empresa para el campo 'name' de clients
        contact_person: company_name ? name : position, // Si hay empresa, el nombre es la persona
        email,
        phone,
        notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Insertar en CONTACT_LEADS (CRM)
      // Mapeo: name -> name (Persona), company -> company_name
      
      const leadData = {
        company_id: targetCompanyId,
        name,
        email: email || '', // contact_leads requiere email NOT NULL en esquema? Verificamos
        company: company_name || 'Particular', // contact_leads requiere company NOT NULL
        pain_point: notes || 'Creado manualmente', // contact_leads requiere pain_point NOT NULL
        phone,
        notes,
        status: 'new',
        source: 'manual_entry',
        submitted_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('contact_leads')
        .insert([leadData])
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error: any) {
    console.error('API Post Error:', error)
    return NextResponse.json({ error: error.message || 'Error al crear contacto' }, { status: 500 })
  }
}
