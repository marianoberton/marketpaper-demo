import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener el usuario actual y su company_id
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Determinar el company_id a usar
    let targetCompanyId: string

    if (currentUser.role === 'super_admin') {
      // Super admin puede ver cualquier empresa especificada, o la primera disponible
      const { searchParams } = new URL(request.url)
      const companyId = searchParams.get('company_id')
      
      if (companyId) {
        targetCompanyId = companyId
      } else {
        const { data: companies } = await supabase
          .from('companies')
          .select('id')
          .limit(1)
        
        if (companies && companies.length > 0) {
          targetCompanyId = companies[0].id
        } else {
          return NextResponse.json({ error: 'No se encontró una compañía' }, { status: 400 })
        }
      }
    } else {
      // Usuarios regulares solo pueden ver su propia empresa
      if (!currentUser.company_id) {
        return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 400 })
      }
      targetCompanyId = currentUser.company_id
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
    
    // Obtener el usuario actual y su company_id
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener datos del proyecto del cuerpo de la petición
    const projectData = await request.json()

    // Validar datos requeridos
    if (!projectData.name?.trim()) {
      return NextResponse.json({ error: 'El nombre del proyecto es requerido' }, { status: 400 })
    }

    if (!projectData.address?.trim()) {
      return NextResponse.json({ error: 'La dirección del proyecto es requerida' }, { status: 400 })
    }

    // Determinar el company_id a usar
    let targetCompanyId: string

    if (currentUser.role === 'super_admin') {
      // Super admin puede crear en cualquier empresa especificada
      targetCompanyId = projectData.company_id || currentUser.company_id
      
      if (!targetCompanyId) {
        const { data: companies } = await supabase
          .from('companies')
          .select('id')
          .limit(1)
        
        if (companies && companies.length > 0) {
          targetCompanyId = companies[0].id
        } else {
          return NextResponse.json({ error: 'No se encontró una compañía' }, { status: 400 })
        }
      }
    } else {
      // Usuarios regulares solo pueden crear en su propia empresa
      if (!currentUser.company_id) {
        return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 400 })
      }
      targetCompanyId = currentUser.company_id
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
    
    // Obtener el usuario actual
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener datos del proyecto del cuerpo de la petición
    const { id, ...projectData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID del proyecto es requerido' }, { status: 400 })
    }

    // Verificar que el proyecto pertenece a la empresa del usuario (excepto super admin)
    if (currentUser.role !== 'super_admin') {
      const { data: currentProject } = await supabase
        .from('projects')
        .select('company_id')
        .eq('id', id)
        .single()
      
      if (!currentProject || currentProject.company_id !== currentUser.company_id) {
        return NextResponse.json({ error: 'Sin permisos para actualizar este proyecto' }, { status: 403 })
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

// DELETE method for deleting projects
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener el usuario actual
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener ID del proyecto de los parámetros de la URL
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('id')

    if (!projectId) {
      return NextResponse.json({ error: 'ID del proyecto es requerido' }, { status: 400 })
    }

    // Verificar que el proyecto existe y obtener información
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, company_id, name')
      .eq('id', projectId)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Verificar permisos - solo super admin o usuarios de la misma empresa
    if (currentUser.role !== 'super_admin' && currentUser.company_id !== project.company_id) {
      return NextResponse.json({ error: 'Sin permisos para eliminar este proyecto' }, { status: 403 })
    }

    // Verificar si hay documentos asociados
    const { data: documents, error: docsError } = await supabase
      .from('project_documents')
      .select('id')
      .eq('project_id', projectId)
      .limit(1)

    if (docsError) {
      console.error('Error checking project documents:', docsError)
      // Continuar con la eliminación aunque falle la verificación de documentos
    }

    // Si hay documentos, notificar al usuario pero permitir la eliminación
    let warningMessage = ''
    if (documents && documents.length > 0) {
      warningMessage = ' Se eliminarán también todos los documentos asociados.'
    }

    // Eliminar el proyecto (las eliminaciones en cascada se encargarán de las dependencias)
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (deleteError) {
      console.error('Error deleting project:', deleteError)
      return NextResponse.json({ error: 'Error al eliminar el proyecto' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: `Proyecto "${project.name}" eliminado exitosamente.${warningMessage}` 
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 