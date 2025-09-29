'use client'

import { Users } from 'lucide-react'
import { Project } from '@/lib/construction'
import ProjectProfessionalsCard from './ProjectProfessionalsCard'

interface ProjectTeamTabProps {
  project: Project
  isEditing?: boolean
  editedProject?: Project
  setEditedProject?: (project: Project | ((prev: Project) => Project)) => void
}

export default function ProjectTeamTab({ 
  project, 
  isEditing = false, 
  editedProject, 
  setEditedProject 
}: ProjectTeamTabProps) {
  return (
    <div className="space-y-6">
      {/* Encabezado de la pestaña */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Equipo del Proyecto
          </h2>
          <p className="text-gray-600 mt-1">
            Gestiona los profesionales y especialistas del proyecto
          </p>
        </div>
      </div>

      {/* Componente ProjectProfessionalsCard */}
      <ProjectProfessionalsCard
        project={project}
        isEditing={isEditing}
        editedProject={editedProject || project}
        setEditedProject={setEditedProject || (() => {})}
      />
   
    </div>
  )
}