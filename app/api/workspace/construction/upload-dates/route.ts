import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { calculateDaysUntilExpiration } from '@/lib/utils/date-utils'
import { getExpirationDays, calculateExpirationDate } from '@/lib/document-expiration-config'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener el usuario actual y su company_id
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')
    const sectionName = searchParams.get('section_name')

    // Determinar el company_id a usar
    let targetCompanyId: string

    if (currentUser.role === 'super_admin') {
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
      if (!currentUser.company_id) {
        return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 400 })
      }
      targetCompanyId = currentUser.company_id
    }

    // Obtener documentos con upload_date de project_documents y calcular fechas de vencimiento
    const { data: documents, error } = await supabase
      .from('project_documents')
      .select(`
        id,
        project_id,
        section_name,
        upload_date,
        projects!inner(
          id,
          name,
          company_id
        )
      `)
      .eq('projects.company_id', targetCompanyId)
      .not('upload_date', 'is', null)
      .order('upload_date', { ascending: false })

    if (error) {
      console.error('Error fetching documents:', error)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json([])
    }

    // Filtrar por project_id si se especifica
    let filteredData = documents
    if (projectId) {
      filteredData = documents.filter(item => item.project_id === projectId)
    }

    // Filtrar por section_name si se especifica
    if (sectionName) {
      filteredData = filteredData.filter(item => item.section_name === sectionName)
    }

    // Transformar los datos y calcular fechas de vencimiento
    const transformedData = filteredData.map((item: any) => {
      // Calcular fecha de vencimiento usando la configuración por tipo de documento
      const expirationDateString = calculateExpirationDate(item.upload_date, item.section_name)
      
      const daysCalculation = calculateDaysUntilExpiration(expirationDateString)
      
      return {
        id: item.id,
        project_id: item.project_id,
        project_name: item.projects?.name || 'Proyecto desconocido',
        section_name: item.section_name,
        upload_date: item.upload_date,
        expiration_date: expirationDateString,
        days_remaining: daysCalculation.days, // Extraer solo el número de días
        created_at: item.upload_date, // Para compatibilidad
        updated_at: item.upload_date  // Para compatibilidad
      }
    })

    return NextResponse.json(transformedData)

  } catch (error) {
    console.error('Error in GET /api/workspace/construction/upload-dates:', error)
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

    const body = await request.json()
    const { project_id, section_name, upload_date } = body

    if (!project_id || !section_name || !upload_date) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: project_id, section_name, upload_date' },
        { status: 400 }
      )
    }

    // Determinar el company_id a usar
    let targetCompanyId: string
    if (currentUser.role === 'super_admin') {
      targetCompanyId = currentUser.company_id || '57bffb9f-78ba-4252-a9ea-10adf83c3155'
    } else {
      if (!currentUser.company_id) {
        return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 400 })
      }
      targetCompanyId = currentUser.company_id
    }
      
    // Validar que el proyecto existe Y pertenece a la empresa del usuario
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, company_id, name')
      .eq('id', project_id)
      .eq('company_id', targetCompanyId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: `Proyecto no encontrado o sin permisos: ${project_id}` },
        { status: 404 }
      )
    }

    // Actualizar la fecha de carga en todos los documentos de la sección
    const { data: updatedDocuments, error: updateError } = await supabase
      .from('project_documents')
      .update({ upload_date })
      .eq('project_id', project_id)
      .eq('section_name', section_name)
      .select()

    if (updateError) {
      console.error('Error al actualizar fechas de carga:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar las fechas de carga de los documentos' },
        { status: 500 }
      )
    }

    // Calcular y guardar la fecha de vencimiento
    const { calculateExpirationDate } = await import('@/lib/document-expiration-config')
    const expirationDate = calculateExpirationDate(upload_date, section_name)
    
    const { data: expirationData, error: expirationError } = await supabase
      .from('project_expiration_dates')
      .upsert({
        project_id,
        section_name,
        expiration_date: expirationDate,
        created_by: currentUser.id,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'project_id,section_name'
      })
      .select()
      .single()

    if (expirationError) {
      console.error('Error al guardar fecha de vencimiento:', expirationError)
      return NextResponse.json(
        { error: 'Error al guardar la fecha de vencimiento' },
        { status: 500 }
      )
    }

    // Mantener compatibilidad con project_upload_dates
    const { error: uploadDateError } = await supabase
      .from('project_upload_dates')
      .upsert({
        project_id,
        section_name,
        upload_date,
        created_by: currentUser.id
      }, {
        onConflict: 'project_id,section_name'
      })

    if (uploadDateError) {
      console.error('Error al guardar en project_upload_dates:', uploadDateError)
      // No fallar la operación principal
    }

    return NextResponse.json({
      success: true,
      upload_date,
      expiration_date: expirationDate,
      documents_updated: updatedDocuments?.length || 0,
      message: `Fecha de carga actualizada para ${updatedDocuments?.length || 0} documentos en la sección "${section_name}"`
    })

  } catch (error) {
    console.error('Error en POST /upload-dates:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
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

    const body = await request.json()
    const { id, section_name, upload_date } = body

    if (!id) {
      return NextResponse.json({ error: 'ID faltante' }, { status: 400 })
    }

    const updateData: any = {}
    if (section_name !== undefined) updateData.section_name = section_name
    if (upload_date !== undefined) updateData.upload_date = upload_date
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('project_upload_dates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating upload date:', error)
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT upload-dates API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener el usuario actual
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID faltante' }, { status: 400 })
    }

    const { error } = await supabase
      .from('project_upload_dates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting upload date:', error)
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE upload-dates API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}