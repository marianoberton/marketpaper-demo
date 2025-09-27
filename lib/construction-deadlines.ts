// Lógica de negocio para plazos de construcción

import { createClient } from '@/utils/supabase/client';
import type { 
  ConstructionDeadline, 
  DeadlineStatusInfo, 
  DeadlineCalculationResult,
  ProjectWithDeadline,
  ConstructionDeadlineRule
} from '@/types/construction-deadlines';

const supabase = createClient();

/**
 * Calcula el estado del plazo basado en días restantes
 */
export function calculateDeadlineStatus(daysRemaining: number): DeadlineStatusInfo {
  if (daysRemaining < 0) {
    return {
      status: 'expired',
      daysRemaining,
      statusText: `Vencido hace ${Math.abs(daysRemaining)} días`,
      statusColor: 'red',
      urgencyLevel: 'high'
    };
  } else if (daysRemaining <= 30) {
    return {
      status: 'warning',
      daysRemaining,
      statusText: `${daysRemaining} días restantes`,
      statusColor: 'red',
      urgencyLevel: 'high'
    };
  } else if (daysRemaining <= 90) {
    return {
      status: 'warning',
      daysRemaining,
      statusText: `${daysRemaining} días restantes`,
      statusColor: 'yellow',
      urgencyLevel: 'medium'
    };
  } else if (daysRemaining <= 180) {
    return {
      status: 'active',
      daysRemaining,
      statusText: `${daysRemaining} días restantes`,
      statusColor: 'yellow',
      urgencyLevel: 'low'
    };
  } else {
    return {
      status: 'active',
      daysRemaining,
      statusText: `${daysRemaining} días restantes`,
      statusColor: 'green',
      urgencyLevel: 'none'
    };
  }
}

/**
 * Formatea los días restantes en un texto legible
 */
export function formatTimeRemaining(daysRemaining: number): string {
  if (daysRemaining < 0) {
    const absDays = Math.abs(daysRemaining);
    if (absDays < 30) {
      return `Vencido hace ${absDays} días`;
    } else if (absDays < 365) {
      const months = Math.floor(absDays / 30);
      return `Vencido hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
    } else {
      const years = Math.floor(absDays / 365);
      return `Vencido hace ${years} ${years === 1 ? 'año' : 'años'}`;
    }
  }

  if (daysRemaining < 30) {
    return `${daysRemaining} días restantes`;
  } else if (daysRemaining < 365) {
    const months = Math.floor(daysRemaining / 30);
    const remainingDays = daysRemaining % 30;
    if (remainingDays === 0) {
      return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    return `${months}m ${remainingDays}d`;
  } else {
    const years = Math.floor(daysRemaining / 365);
    const remainingMonths = Math.floor((daysRemaining % 365) / 30);
    if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'año' : 'años'}`;
    }
    return `${years}a ${remainingMonths}m`;
  }
}

/**
 * Obtiene las reglas de plazo para una compañía
 */
export async function getDeadlineRules(companyId: string): Promise<ConstructionDeadlineRule[]> {
  const { data, error } = await supabase
    .from('construction_deadline_rules')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('project_type');

  if (error) {
    console.error('Error fetching deadline rules:', error);
    return [];
  }

  return data || [];
}

/**
 * Calcula el plazo de construcción para un proyecto
 */
export async function calculateConstructionDeadline(
  projectId: string,
  constructionStartDate: string
): Promise<DeadlineCalculationResult> {
  try {
    const { data, error } = await supabase.rpc('calculate_construction_deadline', {
      p_project_id: projectId,
      p_construction_start_date: constructionStartDate
    });

    if (error) {
      throw error;
    }

    // Obtener el proyecto actualizado para devolver los datos
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('construction_start_date, construction_end_date, days_remaining, deadline_status')
      .eq('id', projectId)
      .single();

    if (projectError) {
      throw projectError;
    }

    return {
      success: true,
      projectId,
      constructionStartDate: project.construction_start_date,
      constructionEndDate: project.construction_end_date,
      daysRemaining: project.days_remaining,
      deadlineStatus: project.deadline_status
    };
  } catch (error) {
    console.error('Error calculating construction deadline:', error);
    return {
      success: false,
      projectId,
      constructionStartDate,
      constructionEndDate: '',
      daysRemaining: 0,
      deadlineStatus: 'pending',
      message: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Obtiene proyectos con información de plazos
 */
export async function getProjectsWithDeadlines(companyId: string): Promise<ProjectWithDeadline[]> {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      project_type,
      construction_deadline_months,
      permit_issue_date,
      construction_start_date,
      construction_end_date,
      deadline_status,
      days_remaining
    `)
    .eq('company_id', companyId)
    .order('deadline_status', { ascending: false })
    .order('days_remaining', { ascending: true });

  if (error) {
    console.error('Error fetching projects with deadlines:', error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene proyectos que requieren atención urgente
 */
export async function getUrgentProjects(companyId: string): Promise<ProjectWithDeadline[]> {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      project_type,
      construction_deadline_months,
      permit_issue_date,
      construction_start_date,
      construction_end_date,
      deadline_status,
      days_remaining
    `)
    .eq('company_id', companyId)
    .in('deadline_status', ['expired', 'warning'])
    .order('days_remaining', { ascending: true });

  if (error) {
    console.error('Error fetching urgent projects:', error);
    return [];
  }

  return data || [];
}

/**
 * Actualiza todos los plazos de construcción existentes
 */
export async function updateAllConstructionDeadlines(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('update_all_construction_deadlines');

    if (error) {
      throw error;
    }

    return data || 0;
  } catch (error) {
    console.error('Error updating all construction deadlines:', error);
    return 0;
  }
}

/**
 * Verifica si un proyecto tiene documentos relacionados con plazos
 */
export async function hasDeadlineDocuments(projectId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('project_documents')
    .select('id')
    .eq('project_id', projectId)
    .in('section_name', ['Permiso de Obra', 'Alta Inicio de obra'])
    .limit(1);

  if (error) {
    console.error('Error checking deadline documents:', error);
    return false;
  }

  return (data?.length || 0) > 0;
}

/**
 * Obtiene el historial de cambios de plazos para un proyecto
 */
export async function getDeadlineHistory(projectId: string) {
  const { data, error } = await supabase
    .from('document_relationships')
    .select(`
      id,
      relationship_type,
      created_at,
      parent_document:project_documents!parent_document_id(
        id,
        section_name,
        file_name,
        created_at
      ),
      child_document:project_documents!child_document_id(
        id,
        section_name,
        file_name,
        created_at
      )
    `)
    .eq('project_id', projectId)
    .eq('relationship_type', 'triggers_deadline')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching deadline history:', error);
    return [];
  }

  return data || [];
}