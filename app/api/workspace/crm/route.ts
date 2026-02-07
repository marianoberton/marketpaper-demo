import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const filterSource = searchParams.get('source') || ''
    const filterTag = searchParams.get('tag') || ''
    const filterHasContacts = searchParams.get('has_contacts') || ''
    const filterDateFrom = searchParams.get('date_from') || ''
    const filterDateTo = searchParams.get('date_to') || ''

    let targetCompanyId: string
    if (currentUser.role === 'super_admin') {
      const companyId = searchParams.get('company_id')
      if (companyId) {
        targetCompanyId = companyId
      } else if (currentUser.company_id) {
        targetCompanyId = currentUser.company_id
      } else {
        return NextResponse.json({ error: 'company_id requerido para super_admin' }, { status: 400 })
      }
    } else {
      if (!currentUser.company_id) {
        return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 400 })
      }
      targetCompanyId = currentUser.company_id
    }

    const supabase = await createClient()

    // Fetch clients
    let query = supabase
      .from('clients')
      .select('*')
      .eq('company_id', targetCompanyId)
      .order('name')

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,cuit.ilike.%${search}%`)
    }

    if (filterSource) {
      query = query.eq('source', filterSource)
    }

    if (filterTag) {
      query = query.contains('tags', JSON.stringify([filterTag]))
    }

    if (filterDateFrom) {
      query = query.gte('created_at', filterDateFrom)
    }

    if (filterDateTo) {
      query = query.lte('created_at', filterDateTo + 'T23:59:59.999Z')
    }

    const { data: clients, error } = await query

    if (error) {
      console.error('Error fetching clients:', error)
      return NextResponse.json({ error: 'Error al cargar empresas clientes' }, { status: 500 })
    }

    // Fetch contact counts per client
    const clientIds = (clients || []).map(c => c.id)
    let contactCounts: Record<string, number> = {}

    if (clientIds.length > 0) {
      const { data: contacts } = await supabase
        .from('crm_contacts')
        .select('client_id')
        .eq('company_id', targetCompanyId)
        .in('client_id', clientIds)

      if (contacts) {
        for (const contact of contacts) {
          contactCounts[contact.client_id] = (contactCounts[contact.client_id] || 0) + 1
        }
      }
    }

    // Enrich clients with contact count
    let enrichedClients = (clients || []).map(client => ({
      ...client,
      contact_count: contactCounts[client.id] || 0
    }))

    // Filter by has_contacts (post-enrichment)
    if (filterHasContacts === 'with') {
      enrichedClients = enrichedClients.filter(c => c.contact_count > 0)
    } else if (filterHasContacts === 'without') {
      enrichedClients = enrichedClients.filter(c => c.contact_count === 0)
    }

    // Stats
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const totalClients = enrichedClients.length
    const totalContacts = Object.values(contactCounts).reduce((sum, count) => sum + count, 0)
    const newThisMonth = enrichedClients.filter(c => c.created_at >= monthStart).length
    const withoutContacts = enrichedClients.filter(c => c.contact_count === 0).length

    return NextResponse.json({
      success: true,
      data: enrichedClients,
      stats: {
        totalClients,
        totalContacts,
        newThisMonth,
        withoutContacts
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'El nombre de la empresa es requerido' }, { status: 400 })
    }

    let targetCompanyId: string
    if (currentUser.role === 'super_admin') {
      targetCompanyId = body.company_id || currentUser.company_id
      if (!targetCompanyId) {
        return NextResponse.json({ error: 'company_id requerido' }, { status: 400 })
      }
    } else {
      if (!currentUser.company_id) {
        return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 400 })
      }
      targetCompanyId = currentUser.company_id
    }

    const supabase = await createClient()

    // Clean empty strings to null
    const processedData: Record<string, unknown> = {
      name: body.name.trim(),
      company_id: targetCompanyId,
    }
    const optionalFields = ['email', 'phone', 'address', 'cuit', 'website_url', 'notes', 'source']
    for (const field of optionalFields) {
      processedData[field] = body[field]?.trim() || null
    }
    if (Array.isArray(body.tags)) {
      processedData.tags = body.tags
    }

    const { data: client, error } = await supabase
      .from('clients')
      .insert(processedData)
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      return NextResponse.json({ error: 'Error al crear la empresa cliente' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: client }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
