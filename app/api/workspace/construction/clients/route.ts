import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Por ahora trabajamos como super admin - simplificamos sin autenticación específica
    // TODO: Implementar lógica de usuarios por compañía más adelante
    
    // Obtener company_id de los parámetros de la URL
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    
    // Si no hay company_id, usar la primera compañía disponible (modo desarrollo)
    let targetCompanyId = companyId
    
    if (!targetCompanyId) {
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
      
      if (companies && companies.length > 0) {
        targetCompanyId = companies[0].id
      }
    }

    if (!targetCompanyId) {
      return NextResponse.json({ error: 'No se encontró una compañía' }, { status: 400 })
    }

    // Obtener clientes de la compañía
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', targetCompanyId)
      .order('name')

    if (error) {
      console.error('Error fetching clients:', error)
      return NextResponse.json({ error: 'Error al cargar clientes' }, { status: 500 })
    }

    return NextResponse.json({ clients })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener datos del cliente del cuerpo de la petición
    const clientData = await request.json()

    // Validar datos requeridos
    if (!clientData.name?.trim()) {
      return NextResponse.json({ error: 'El nombre del cliente es requerido' }, { status: 400 })
    }

    // Obtener company_id del cuerpo o usar la primera compañía disponible
    let targetCompanyId = clientData.company_id
    
    if (!targetCompanyId) {
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
      
      if (companies && companies.length > 0) {
        targetCompanyId = companies[0].id
      }
    }

    if (!targetCompanyId) {
      return NextResponse.json({ error: 'No se encontró una compañía' }, { status: 400 })
    }

    // Crear el cliente
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        ...clientData,
        company_id: targetCompanyId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      return NextResponse.json({ error: 'Error al crear el cliente' }, { status: 500 })
    }

    return NextResponse.json({ client }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 