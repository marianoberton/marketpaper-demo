import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth-server'

// Configuración de relaciones entre documentos
const DOCUMENT_RELATIONSHIPS: Record<string, {
  triggers: string[]
  deadline_from?: string
  deadline_days?: number
  deadline_target?: string
  auto_complete?: boolean
}> = {
  'Demolición': {
    triggers: ['Permiso de Demolición - Informe'], // Cuando se carga Demolición, marca estos como completados
    deadline_from: 'Permiso de Demolición - Informe', // El plazo de 1 año comienza desde esta fecha
    deadline_days: 365 // 1 año para cargar Demolición
  },
  'Permiso de Demolición - Plano': {
    triggers: [], // No marca otros documentos como completados
    auto_complete: true // Se marca a sí mismo como completado al cargar
  },
  'Registro etapa de proyecto - Informe': {
    triggers: ['Consulta DGIUR'], // Cuando se carga Registro etapa de proyecto - Informe, marca Consulta DGIUR como completado
    auto_complete: false, // NO se marca a sí mismo como completado (está enlazado con Permiso de Obra)
    deadline_from: 'Registro etapa de proyecto - Informe', // El plazo de 1 año para Permiso de Obra comienza desde esta fecha
    deadline_days: 365, // 1 año para cargar Permiso de Obra
    deadline_target: 'Permiso de obra' // El documento que debe cargarse dentro del plazo
  },
  'Permiso de obra': {
    triggers: [], // No marca otros documentos como completados
    auto_complete: false, // NO se marca a sí mismo como completado (está enlazado con Alta Inicio de obra)
    deadline_from: 'Permiso de obra', // El plazo de 1 año para Alta Inicio de obra comienza desde esta fecha
    deadline_days: 365, // 1 año para cargar Alta Inicio de obra
    deadline_target: 'Alta Inicio de obra' // El documento que debe cargarse dentro del plazo
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener usuario actual
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

    // Verificar acceso al proyecto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, company_id, project_type')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Verificar permisos (excepto super admin)
    if (currentUser.role !== 'super_admin' && project.company_id !== currentUser.company_id) {
      return NextResponse.json({ error: 'Sin permisos para este proyecto' }, { status: 403 })
    }

    const results = []

    // Procesar relaciones automáticas
    if (DOCUMENT_RELATIONSHIPS[section_name]) {
      const relationship = DOCUMENT_RELATIONSHIPS[section_name]
      
      // 1. Auto-completar el documento actual si está configurado
      if (relationship.auto_complete) {
        const { data: autoCompleteResult, error: autoCompleteError } = await supabase
          .rpc('toggle_stage_completion', {
            p_project_id: project_id,
            p_stage_name: section_name,
            p_completed: true,
            p_user_id: currentUser.id
          })

        if (autoCompleteError) {
          console.error(`Error auto-completing ${section_name}:`, autoCompleteError)
        } else {
          results.push({
            action: 'auto_completed',
            stage_name: section_name,
            success: true
          })
        }
      }
      
      // 2. Marcar documentos relacionados como completados
      for (const triggerSection of relationship.triggers) {
        const { data: completionResult, error: completionError } = await supabase
          .rpc('toggle_stage_completion', {
            p_project_id: project_id,
            p_stage_name: triggerSection,
            p_completed: true,
            p_user_id: currentUser.id
          })

        if (completionError) {
          console.error(`Error marking ${triggerSection} as completed:`, completionError)
        } else {
          results.push({
            action: 'stage_completed',
            stage_name: triggerSection,
            success: true
          })
        }
      }

      // 3. Configurar fecha de vencimiento basada en el documento relacionado
      if (relationship.deadline_from) {
        // Buscar la fecha de carga del documento base
        const { data: baseDocument, error: baseDocError } = await supabase
          .from('project_documents')
          .select('upload_date')
          .eq('project_id', project_id)
          .eq('section_name', relationship.deadline_from)
          .not('upload_date', 'is', null)
          .order('upload_date', { ascending: false })
          .limit(1)
          .single()

        if (!baseDocError && baseDocument?.upload_date && relationship.deadline_days) {
          // Calcular fecha de vencimiento desde la fecha del documento base
          const baseDate = new Date(baseDocument.upload_date)
          const expirationDate = new Date(baseDate.getTime() + (relationship.deadline_days * 24 * 60 * 60 * 1000))
          
          // Determinar el documento objetivo (si está especificado) o usar el actual
          const targetSection = relationship.deadline_target || section_name
          
          // Guardar la fecha de vencimiento personalizada
          const { error: expirationError } = await supabase
            .from('project_expiration_dates')
            .upsert({
              project_id,
              section_name: targetSection,
              expiration_date: expirationDate.toISOString().split('T')[0],
              created_by: currentUser.id,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'project_id,section_name'
            })

          if (expirationError) {
            console.error('Error setting custom expiration date:', expirationError)
          } else {
            results.push({
              action: 'custom_expiration_set',
              section_name: targetSection,
              expiration_date: expirationDate.toISOString().split('T')[0],
              based_on: relationship.deadline_from,
              success: true
            })
          }
        }
      }
    }

    // Lógica especial para "Permiso de Demolición - Informe"
    if (section_name === 'Permiso de Demolición - Informe') {
      // Configurar fecha de vencimiento de 1 año para cargar "Demolición"
      const uploadDateObj = new Date(upload_date)
      const demolicionDeadline = new Date(uploadDateObj.getTime() + (365 * 24 * 60 * 60 * 1000))
      
      // Crear/actualizar fecha de vencimiento para "Demolición" basada en esta fecha
      const { error: demolicionExpirationError } = await supabase
        .from('project_expiration_dates')
        .upsert({
          project_id,
          section_name: 'Demolición',
          expiration_date: demolicionDeadline.toISOString().split('T')[0],
          created_by: currentUser.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'project_id,section_name'
        })

      if (demolicionExpirationError) {
        console.error('Error setting Demolición deadline:', demolicionExpirationError)
      } else {
        results.push({
          action: 'demolicion_deadline_set',
          section_name: 'Demolición',
          expiration_date: demolicionDeadline.toISOString().split('T')[0],
          based_on: 'Permiso de Demolición - Informe',
          success: true
        })
      }
    }

    return NextResponse.json({
      success: true,
      relationships_processed: results,
      message: `Procesadas ${results.length} relaciones automáticas para ${section_name}`
    })

  } catch (error) {
    console.error('Error in document relationships:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}