import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// POST - Crear template a partir de un tema existente
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || !['company_admin', 'company_owner', 'super_admin', 'manager'].includes(profile.role || '')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para crear templates' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { tema_id, template_name, gerencia, categoria } = body

    if (!tema_id || !template_name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'tema_id y template_name son requeridos' },
        { status: 400 }
      )
    }

    // Fetch tema tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tema_tasks')
      .select('title, description, task_type, sort_order, checklist, dias_estimados')
      .eq('tema_id', tema_id)
      .order('sort_order', { ascending: true })

    if (tasksError) {
      return NextResponse.json(
        { success: false, error: 'Error al obtener tareas del tema' },
        { status: 500 }
      )
    }

    // Build tareas_template JSONB
    const tareasTemplate = (tasks || []).map((t: any, index: number) => ({
      orden: index + 1,
      titulo: t.title,
      descripcion: t.description || undefined,
      tipo: t.task_type || 'interna',
      asignado_default: 'gerenta_area',
      checklist: (t.checklist || []).map((item: any) =>
        typeof item === 'string' ? item : item.label
      ),
      dias_estimados: t.dias_estimados || null,
    }))

    // Create the template
    const { data: type, error: createError } = await supabase
      .from('tema_types')
      .insert({
        company_id: profile.company_id,
        name: template_name.trim(),
        description: `Creado a partir de tema existente`,
        color: '#6B7280',
        icon: 'file-code-2',
        tareas_template: tareasTemplate,
        gerencia: gerencia || null,
        categoria: categoria || null,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating template from tema:', createError)
      return NextResponse.json(
        { success: false, error: 'Error al crear template', debug: createError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, type }, { status: 201 })
  } catch (error) {
    console.error('Create Template from Tema API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
