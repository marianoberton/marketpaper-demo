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

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener datos del cliente del cuerpo de la petición
    const { id, ...clientData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID del cliente es requerido' }, { status: 400 })
    }

    // Validar datos requeridos
    if (clientData.name && !clientData.name.trim()) {
      return NextResponse.json({ error: 'El nombre del cliente no puede estar vacío' }, { status: 400 })
    }

    // Actualizar el cliente
    const { data: client, error } = await supabase
      .from('clients')
      .update({
        ...clientData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating client:', error)
      return NextResponse.json({ error: 'Error al actualizar el cliente' }, { status: 500 })
    }

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener ID del cliente de los parámetros de la URL
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('id')

    if (!clientId) {
      return NextResponse.json({ error: 'ID del cliente es requerido' }, { status: 400 })
    }

    // Verificar si el cliente tiene proyectos asociados
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('client_id', clientId)
      .limit(1)

    if (projectsError) {
      console.error('Error checking client projects:', projectsError)
      return NextResponse.json({ error: 'Error al verificar proyectos del cliente' }, { status: 500 })
    }

    if (projects && projects.length > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar el cliente porque tiene proyectos asociados' 
      }, { status: 400 })
    }

    // Eliminar el cliente
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)

    if (error) {
      console.error('Error deleting client:', error)
      return NextResponse.json({ error: 'Error al eliminar el cliente' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Cliente eliminado exitosamente' })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 