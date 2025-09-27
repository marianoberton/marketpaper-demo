import React from 'react';
import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { calculateDeadlineStatus, formatTimeRemaining } from '@/lib/construction-deadlines';
import type { DeadlineStatusInfo } from '@/types/construction-deadlines';

interface DeadlineStatusProps {
  daysRemaining?: number;
  constructionEndDate?: string;
  constructionStartDate?: string;
  deadlineStatus?: 'pending' | 'active' | 'warning' | 'expired';
  showProgress?: boolean;
  compact?: boolean;
  className?: string;
}

export function DeadlineStatus({
  daysRemaining,
  constructionEndDate,
  constructionStartDate,
  deadlineStatus = 'pending',
  showProgress = false,
  compact = false,
  className = ''
}: DeadlineStatusProps) {
  // Si no hay días restantes, mostrar estado pendiente
  if (daysRemaining === undefined || daysRemaining === null) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Clock className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">
          {compact ? 'Pendiente' : 'Plazo pendiente de cálculo'}
        </span>
      </div>
    );
  }

  const statusInfo: DeadlineStatusInfo = calculateDeadlineStatus(daysRemaining);
  
  // Calcular progreso si tenemos fechas
  let progressPercentage = 0;
  let totalDays = 0;
  
  if (constructionStartDate && constructionEndDate) {
    const startDate = new Date(constructionStartDate);
    const endDate = new Date(constructionEndDate);
    const currentDate = new Date();
    
    totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    progressPercentage = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);
  }

  const getIcon = () => {
    switch (statusInfo.status) {
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'active':
        return statusInfo.urgencyLevel === 'none' 
          ? <CheckCircle className="h-4 w-4 text-green-500" />
          : <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getBadgeVariant = () => {
    switch (statusInfo.statusColor) {
      case 'red':
        return 'destructive';
      case 'yellow':
        return 'secondary';
      case 'green':
        return 'default';
      default:
        return 'outline';
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {getIcon()}
        <Badge variant={getBadgeVariant()} className="text-xs">
          {formatTimeRemaining(daysRemaining)}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getIcon()}
            <div>
              <h4 className="font-medium text-sm">Plazo de Obra</h4>
              <p className="text-xs text-gray-500">
                {constructionEndDate 
                  ? `Vence: ${new Date(constructionEndDate).toLocaleDateString('es-ES')}`
                  : 'Fecha de vencimiento pendiente'
                }
              </p>
            </div>
          </div>
          <Badge variant={getBadgeVariant()}>
            {statusInfo.status === 'expired' ? 'Vencido' : 
             statusInfo.status === 'warning' ? 'Próximo a vencer' :
             statusInfo.status === 'active' ? 'Activo' : 'Pendiente'}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              {formatTimeRemaining(daysRemaining)}
            </span>
            {totalDays > 0 && (
              <span className="text-xs text-gray-500">
                {Math.round(progressPercentage)}% transcurrido
              </span>
            )}
          </div>
          
          {showProgress && totalDays > 0 && (
            <Progress 
              value={progressPercentage} 
              className="h-2"
              // Cambiar color según el estado
              style={{
                '--progress-background': statusInfo.statusColor === 'red' ? '#ef4444' :
                                       statusInfo.statusColor === 'yellow' ? '#eab308' :
                                       '#22c55e'
              } as React.CSSProperties}
            />
          )}
        </div>

        {statusInfo.urgencyLevel === 'high' && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-700 font-medium">
                {statusInfo.status === 'expired' 
                  ? 'Plazo vencido - Acción requerida'
                  : 'Plazo próximo a vencer - Revisar urgente'
                }
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente simplificado para mostrar solo el badge
export function DeadlineBadge({
  daysRemaining,
  deadlineStatus = 'pending',
  className = ''
}: Pick<DeadlineStatusProps, 'daysRemaining' | 'deadlineStatus' | 'className'>) {
  return (
    <DeadlineStatus
      daysRemaining={daysRemaining}
      deadlineStatus={deadlineStatus}
      compact={true}
      className={className}
    />
  );
}

// Componente para mostrar múltiples plazos en una lista
interface DeadlineListProps {
  projects: Array<{
    id: string;
    name: string;
    daysRemaining?: number;
    constructionEndDate?: string;
    constructionStartDate?: string;
    deadlineStatus?: string;
  }>;
  onProjectClick?: (projectId: string) => void;
}

export function DeadlineList({ projects, onProjectClick }: DeadlineListProps) {
  const urgentProjects = projects.filter(p => 
    p.daysRemaining !== undefined && p.daysRemaining <= 90
  );

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No hay proyectos con plazos activos</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {urgentProjects.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Requieren atención urgente ({urgentProjects.length})
          </h3>
        </div>
      )}
      
      {projects.map((project) => (
        <div
          key={project.id}
          className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors ${
            onProjectClick ? 'cursor-pointer' : ''
          }`}
          onClick={() => onProjectClick?.(project.id)}
        >
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{project.name}</h4>
            {project.constructionEndDate && (
              <p className="text-xs text-gray-500">
                Vence: {new Date(project.constructionEndDate).toLocaleDateString('es-ES')}
              </p>
            )}
          </div>
          <DeadlineBadge
            daysRemaining={project.daysRemaining}
            deadlineStatus={project.deadlineStatus as any}
          />
        </div>
      ))}
    </div>
  );
}