'use client'

import { Project } from '@/lib/construction'
import ProjectCoverImage from './ProjectCoverImage'
import ProjectGeneralInfo from './ProjectGeneralInfo'
import ClientInfoCard from './ClientInfoCard'
import CurrentExpensesCard from './CurrentExpensesCard'
import { DeadlineClientPanel } from './DeadlineClientPanel'

interface ProjectSummaryTabProps {
  project: Project
  isEditing?: boolean
  editedProject?: Project
  setEditedProject?: (project: Project | ((prev: Project) => Project)) => void
  onProjectUpdate?: (updatedProject: Project) => void
  expedientes?: any[]
  handleExpedientesChange?: (expedientes: any[]) => void
  handleProjectReload?: () => void
}

export default function ProjectSummaryTab({ 
  project, 
  isEditing = false,
  editedProject = project,
  setEditedProject,
  onProjectUpdate,
  expedientes = [],
  handleExpedientesChange,
  handleProjectReload
}: ProjectSummaryTabProps) {

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprobado':
      case 'Pagado':
      case 'Activo':
        return 'bg-green-500'
      case 'En trámite':
      case 'Pendiente':
        return 'bg-yellow-500'
      case 'Rechazado':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Imagen de portada del proyecto */}
      <ProjectCoverImage
        project={project}
        editedProject={editedProject}
        setEditedProject={setEditedProject || (() => {})}
        onProjectUpdate={onProjectUpdate}
      />

      {/* Layout principal con información general y sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Columna principal - Información General */}
        <div className="xl:col-span-3">
          <ProjectGeneralInfo
            project={project}
            isEditing={isEditing}
            editedProject={editedProject}
            setEditedProject={setEditedProject || (() => {})}
            expedientes={expedientes}
            handleExpedientesChange={handleExpedientesChange || (() => {})}
            handleProjectReload={handleProjectReload || (() => {})}
            getStatusColor={getStatusColor}
          />
        </div>

        {/* Sidebar derecho - Cliente, Fechas de Carga y Detalles */}
        <div className="xl:col-span-1 space-y-6">
          {/* Cliente */}
          <ClientInfoCard project={project} />

          {/* Fechas de Carga de Documentos */}
          <DeadlineClientPanel project={project} />

          {/* Información Económica */}
          <CurrentExpensesCard project={project} />
        </div>
      </div>
    </div>
  )
}