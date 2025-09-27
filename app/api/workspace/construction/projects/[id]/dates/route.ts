import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/auth-server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const projectId = params.id;
    const body = await request.json();
    const { construction_start_date, construction_end_date } = body;

    // Validar campos requeridos
    if (!construction_start_date || !construction_end_date) {
      return NextResponse.json(
        { error: 'Las fechas de inicio y finalización son requeridas' },
        { status: 400 }
      );
    }

    // Validar que la fecha de inicio sea anterior a la de finalización
    const startDate = new Date(construction_start_date);
    const endDate = new Date(construction_end_date);
    
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'La fecha de inicio debe ser anterior a la fecha de finalización' },
        { status: 400 }
      );
    }

    // Verificar que el proyecto existe y pertenece al usuario
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, company_id, project_type, construction_deadline_months')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    // Calcular días restantes
    const currentDate = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    // Determinar estado del deadline
    let deadlineStatus = 'active';
    if (daysRemaining < 0) {
      deadlineStatus = 'expired';
    } else if (daysRemaining <= 90) { // 3 meses de advertencia
      deadlineStatus = 'warning';
    }

    // Actualizar el proyecto con las nuevas fechas
    const { data: updatedProject, error: updateError } = await supabaseAdmin
      .from('projects')
      .update({
        construction_start_date,
        construction_end_date,
        days_remaining: daysRemaining,
        deadline_status: deadlineStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating project dates:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar las fechas del proyecto' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      project: updatedProject,
      message: 'Fechas de construcción actualizadas correctamente'
    });

  } catch (error) {
    console.error('Error in PATCH /api/workspace/construction/projects/[id]/dates:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}