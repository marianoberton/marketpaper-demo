// Tipos para el sistema de plazos de construcción

export interface ConstructionDeadline {
  projectId: string;
  constructionDeadlineMonths: number;
  permitIssueDate?: string;
  constructionStartDate?: string;
  constructionEndDate?: string;
  deadlineStatus: 'pending' | 'active' | 'warning' | 'expired';
  daysRemaining?: number;
}

export interface DocumentRelationship {
  id: string;
  projectId: string;
  parentDocumentId: string;
  childDocumentId: string;
  relationshipType: 'triggers_deadline' | 'depends_on' | 'follows';
  createdAt: string;
}

export interface ConstructionDeadlineRule {
  id: string;
  companyId: string;
  projectType: 'obra_menor' | 'obra_media' | 'obra_mayor';
  deadlineMonths: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeadlineCalculationResult {
  success: boolean;
  projectId: string;
  constructionStartDate: string;
  constructionEndDate: string;
  daysRemaining: number;
  deadlineStatus: string;
  message?: string;
}

export interface DeadlineStatusInfo {
  status: 'pending' | 'active' | 'warning' | 'expired';
  daysRemaining?: number;
  constructionEndDate?: string;
  statusText: string;
  statusColor: 'gray' | 'green' | 'yellow' | 'red';
  urgencyLevel: 'none' | 'low' | 'medium' | 'high';
}

export interface ProjectWithDeadline {
  id: string;
  name: string;
  projectType?: string;
  constructionDeadlineMonths?: number;
  permitIssueDate?: string;
  constructionStartDate?: string;
  constructionEndDate?: string;
  deadlineStatus?: string;
  daysRemaining?: number;
  // ... otros campos del proyecto
}