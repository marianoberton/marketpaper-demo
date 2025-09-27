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

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const sectionName = searchParams.get('sectionName')
    const upcoming = searchParams.get('upcoming') // Para obtener fechas próximas a vencer

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

    // Si se solicitan fechas próximas a vencer
    if (upcoming === 'true') {
      const daysAhead = parseInt(searchParams.get('days') || '30')
      
      const { data: upcomingDates, error } = await supabase
        .rpc('get_upcoming_expirations', {
          p_company_id: targetCompanyId,
          p_days_ahead: daysAhead
        })

      if (error) {
        console.error('Error fetching upcoming expirations:', error)
        return NextResponse.json({ error: 'Error al obtener fechas próximas a vencer' }, { status: 500 })
      }

      return NextResponse.json(upcomingDates)
    }

    // Construir query base
    let query = supabase
      .from('project_expiration_dates')
      .select(`
        *,
        projects!inner(
          id,
          name,
          company_id
        )
      `)
      .eq('projects.company_id', targetCompanyId)

    // Filtrar por proyecto específico si se proporciona
    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    // Filtrar por sección específica si se proporciona
    if (sectionName) {
      query = query.eq('section_name', sectionName)
    }

    const { data: expirationDates, error } = await query.order('expiration_date', { ascending: true })

    if (error) {
      console.error('Error fetching expiration dates:', error)
      return NextResponse.json({ error: 'Error al obtener fechas de vencimiento' }, { status: 500 })
    }

    return NextResponse.json(expirationDates)

  } catch (error) {
    console.error('Error in GET /api/workspace/construction/expiration-dates:', error)
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
    const { project_id, section_name, expiration_date } = body

    if (!project_id || !section_name || !expiration_date) {
      return NextResponse.json({ 
        error: 'Faltan campos requeridos: project_id, section_name, expiration_date' 
      }, { status: 400 })
    }

    // Verificar que el proyecto pertenece a la compañía del usuario
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, company_id')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Verificar permisos
    if (currentUser.role !== 'super_admin' && project.company_id !== currentUser.company_id) {
      return NextResponse.json({ error: 'Sin permisos para este proyecto' }, { status: 403 })
    }

    // Insertar o actualizar fecha de vencimiento (upsert)
    const { data: expirationDate, error } = await supabase
      .from('project_expiration_dates')
      .upsert({
        project_id,
        section_name,
        expiration_date,
        created_by: currentUser.id,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'project_id,section_name'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating/updating expiration date:', error)
      return NextResponse.json({ error: 'Error al guardar fecha de vencimiento' }, { status: 500 })
    }

    return NextResponse.json(expirationDate, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/workspace/construction/expiration-dates:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, expiration_date } = body

    if (!id || !expiration_date) {
      return NextResponse.json({ 
        error: 'Faltan campos requeridos: id, expiration_date' 
      }, { status: 400 })
    }

    // Verificar que la fecha de vencimiento existe y pertenece a la compañía del usuario
    const { data: existingDate, error: fetchError } = await supabase
      .from('project_expiration_dates')
      .select(`
        *,
        projects!inner(company_id)
      `)
      .eq('id', id)
      .single()

    if (fetchError || !existingDate) {
      return NextResponse.json({ error: 'Fecha de vencimiento no encontrada' }, { status: 404 })
    }

    // Verificar permisos
    if (currentUser.role !== 'super_admin' && existingDate.projects.company_id !== currentUser.company_id) {
      return NextResponse.json({ error: 'Sin permisos para esta fecha de vencimiento' }, { status: 403 })
    }

    // Actualizar fecha de vencimiento
    const { data: updatedDate, error } = await supabase
      .from('project_expiration_dates')
      .update({
        expiration_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating expiration date:', error)
      return NextResponse.json({ error: 'Error al actualizar fecha de vencimiento' }, { status: 500 })
    }

    return NextResponse.json(updatedDate)

  } catch (error) {
    console.error('Error in PUT /api/workspace/construction/expiration-dates:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Verificar que la fecha de vencimiento existe y pertenece a la compañía del usuario
    const { data: existingDate, error: fetchError } = await supabase
      .from('project_expiration_dates')
      .select(`
        *,
        projects!inner(company_id)
      `)
      .eq('id', id)
      .single()

    if (fetchError || !existingDate) {
      return NextResponse.json({ error: 'Fecha de vencimiento no encontrada' }, { status: 404 })
    }

    // Verificar permisos
    if (currentUser.role !== 'super_admin' && existingDate.projects.company_id !== currentUser.company_id) {
      return NextResponse.json({ error: 'Sin permisos para esta fecha de vencimiento' }, { status: 403 })
    }

    // Eliminar fecha de vencimiento
    const { error } = await supabase
      .from('project_expiration_dates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting expiration date:', error)
      return NextResponse.json({ error: 'Error al eliminar fecha de vencimiento' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Fecha de vencimiento eliminada correctamente' })

  } catch (error) {
    console.error('Error in DELETE /api/workspace/construction/expiration-dates:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}