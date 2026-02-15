'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Edit,
  Save,
  Trash2
} from 'lucide-react'
import { Project } from '@/lib/construction'
import { getStageColor } from '@/lib/construction-ui'

interface ProjectHeaderProps {
  project: Project
  isEditing: boolean
  onBack: () => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete?: (projectId: string) => void
}

export default function ProjectHeader({
  project,
  isEditing,
  onBack,
  onEdit,
  onSave,
  onCancel,
  onDelete
}: ProjectHeaderProps) {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Volver a Proyectos</span>
            <span className="sm:hidden">Volver</span>
          </Button>
          <Separator orientation="vertical" className="h-8 hidden sm:block" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{project.name}</h1>
            <p className="text-base sm:text-lg text-muted-foreground">{project.dgro_file_number}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={`${getStageColor(project.current_stage || '')} text-white px-4 py-2 text-sm`}>
            {project.current_stage}
          </Badge>
          {isEditing ? (
            <>
              <Button
                onClick={onSave}
                variant="default"
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                size="lg"
              >
                Cancelar
              </Button>
            </>
          ) : (
            <Button
              onClick={onEdit}
              variant="default"
              size="lg"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={() => onDelete(project.id)}
              variant="destructive"
              size="lg"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
