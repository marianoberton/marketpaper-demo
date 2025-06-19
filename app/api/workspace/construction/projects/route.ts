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

    // Obtener proyectos de la compañía con información del cliente
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('company_id', targetCompanyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json({ error: 'Error al cargar proyectos' }, { status: 500 })
    }

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener datos del proyecto del cuerpo de la petición
    const projectData = await request.json()

    // Validar datos requeridos
    if (!projectData.name?.trim()) {
      return NextResponse.json({ error: 'El nombre del proyecto es requerido' }, { status: 400 })
    }

    if (!projectData.address?.trim()) {
      return NextResponse.json({ error: 'La dirección del proyecto es requerida' }, { status: 400 })
    }

    // Obtener company_id del cuerpo o usar la primera compañía disponible
    let targetCompanyId = projectData.company_id
    
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

    // Crear el proyecto
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        ...projectData,
        company_id: targetCompanyId
      })
      .select(`
        *,
        client:clients(*)
      `)
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return NextResponse.json({ error: 'Error al crear el proyecto' }, { status: 500 })
    }

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener datos del proyecto del cuerpo de la petición
    const { id, ...projectData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID del proyecto es requerido' }, { status: 400 })
    }

    // Obtener company_id si no está en los datos
    let targetCompanyId = projectData.company_id
    
    if (!targetCompanyId) {
      // Obtener el proyecto actual para verificar la compañía
      const { data: currentProject } = await supabase
        .from('projects')
        .select('company_id')
        .eq('id', id)
        .single()
      
      if (currentProject) {
        targetCompanyId = currentProject.company_id
      }
    }

    // Actualizar el proyecto
    const { data: project, error } = await supabase
      .from('projects')
      .update({
        ...projectData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        client:clients(*)
      `)
      .single()

    if (error) {
      console.error('Error updating project:', error)
      return NextResponse.json({ error: 'Error al actualizar el proyecto' }, { status: 500 })
    }

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 