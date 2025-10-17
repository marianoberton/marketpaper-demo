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

    // Obtener proyectos de la compañía con información del cliente y expedientes
    console.log('🔍 DEBUG API: Consultando proyectos para company_id:', targetCompanyId)
    
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*),
        expedientes:project_expedientes(*)
      `)
      .eq('company_id', targetCompanyId)
      .order('created_at', { ascending: false })

    console.log('🔍 DEBUG API: Error de consulta:', error)
    console.log('🔍 DEBUG API: Número de proyectos encontrados:', projects?.length || 0)
    
    if (projects && projects.length > 0) {
      console.log('🔍 DEBUG API: Primer proyecto completo:', JSON.stringify(projects[0], null, 2))
      console.log('🔍 DEBUG API: Expedientes del primer proyecto:', projects[0].expedientes)
    }

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

    // Limpiar datos antes de enviar a la base de datos
    const processedData = { ...projectData, company_id: targetCompanyId }
    
    // Convertir strings vacíos a null para evitar problemas
    if (processedData.barrio === '') processedData.barrio = null
    if (processedData.ciudad === '') processedData.ciudad = null
    if (processedData.address === '') processedData.address = null
    if (processedData.architect === '') processedData.architect = null
    if (processedData.builder === '') processedData.builder = null
    if (processedData.notes === '') processedData.notes = null

    // Extraer expedientes del projectData antes de crear el proyecto
    const { expedientes, ...projectDataWithoutExpedientes } = processedData

    // Crear el proyecto
    const { data: project, error } = await supabase
      .from('projects')
      .insert(projectDataWithoutExpedientes)
      .select(`
        *,
        client:clients(*),
        expedientes:project_expedientes(*)
      `)
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return NextResponse.json({ error: 'Error al crear el proyecto' }, { status: 500 })
    }

    // Si hay expedientes, crearlos
    if (expedientes && expedientes.length > 0) {
      const expedientesData = expedientes.map((exp: any) => ({
        project_id: project.id,
        expediente_number: exp.expediente_number,
        expediente_type: exp.expediente_type || 'Otros',
        status: exp.status || 'Pendiente'
      }))

      const { error: expedientesError } = await supabase
        .from('project_expedientes')
        .insert(expedientesData)

      if (expedientesError) {
        console.error('Error creating expedientes:', expedientesError)
        // No fallar la creación del proyecto por error en expedientes
      }
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
    const { id, expedientes, ...projectData } = await request.json()
    
    console.log('PUT /api/workspace/construction/projects - ID:', id)
    console.log('PUT /api/workspace/construction/projects - Data:', projectData)

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

    // Lista de campos permitidos en la tabla projects
    const allowedFields = [
      'name', 'address', 'barrio', 'ciudad', 'surface', 'director_obra', 'builder', 'status', 
      'cover_image_url', 'dgro_file_number', 'project_type', 'project_usage',
      'client_id', 'start_date', 'end_date', 'budget', 'current_stage',
      'permit_status', 'profesionales', 'notes', 'projected_total_cost',
      'paid_total_cost', 'paid_cost_rubro_a', 'paid_cost_rubro_b', 
      'paid_cost_rubro_c', 'last_cost_update', 'enable_tax_management',
      'domain_report_file_url', 'domain_report_upload_date', 
      'domain_report_expiry_date', 'domain_report_is_valid', 'domain_report_notes',
      'insurance_policy_file_url', 'insurance_policy_issue_date', 
      'insurance_policy_expiry_date', 'insurance_policy_is_valid', 'insurance_policy_notes',
      'insurance_policy_number', 'insurance_company',
      'inhibition_report_file_url', 'inhibition_report_upload_date', 'inhibition_report_notes',
      // Campos de compatibilidad temporal
      'architect', 'project_use', 'inspector_name'
    ]
    
    // Filtrar solo campos permitidos y con valores definidos
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    Object.keys(projectData).forEach(key => {
      if (allowedFields.includes(key) && projectData[key] !== undefined) {
        let value = projectData[key]
        // Convertir strings vacíos a null
        if (value === '') value = null
        updateData[key] = value
      }
    })
    
    console.log('Filtered update data:', updateData)

    // Actualizar el proyecto
    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        client:clients(*)
      `)
      .single()

    if (error) {
      console.error('Supabase error updating project:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)
      
      // Verificar si es un error de columna inexistente
      if (error.code === '42703') {
        return NextResponse.json({ 
          error: `Error de base de datos: ${error.message}. Es posible que necesites ejecutar las migraciones pendientes.` 
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        error: `Error al actualizar el proyecto: ${error.message}` 
      }, { status: 500 })
    }

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Manejar expedientes SOLO si se proporcionan explícitamente
    // IMPORTANTE: No eliminar expedientes si no se envían en la actualización
    if (expedientes !== undefined && Array.isArray(expedientes)) {
      console.log('🔍 DEBUG: Actualizando expedientes explícitamente:', expedientes)
      
      // Primero eliminar expedientes existentes
      const { error: deleteError } = await supabase
        .from('project_expedientes')
        .delete()
        .eq('project_id', id)

      if (deleteError) {
        console.error('Error deleting existing expedientes:', deleteError)
      }

      // Luego insertar los nuevos expedientes
      if (expedientes.length > 0) {
        const expedientesData = expedientes.map((exp: any) => ({
          project_id: id,
          expediente_number: exp.expediente_number,
          expediente_type: exp.expediente_type || 'Otros',
          status: exp.status || 'Pendiente'
        }))

        const { error: expedientesError } = await supabase
          .from('project_expedientes')
          .insert(expedientesData)

        if (expedientesError) {
          console.error('Error creating expedientes:', expedientesError)
        }
      }
    } else {
      console.log('🔍 DEBUG: No se enviaron expedientes en la actualización, manteniendo los existentes')
    }

    console.log('Project updated successfully:', project.id)
    return NextResponse.json({ project })
  } catch (error: any) {
    console.error('API Error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json({ 
      error: `Error interno del servidor: ${error.message}` 
    }, { status: 500 })
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