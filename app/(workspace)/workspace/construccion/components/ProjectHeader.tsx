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

interface ProjectHeaderProps {
  project: Project
  isEditing: boolean
  onBack: () => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete?: (projectId: string) => void
}

const getStageColor = (stage: string) => {
  const stageColors: Record<string, string> = {
    // Prefactibilidad
    'Prefactibilidad del proyecto': 'bg-purple-500',
    
    // En Gestoria
    'Consulta DGIUR': 'bg-yellow-500',
    'Registro etapa de proyecto': 'bg-yellow-600',
    'Permiso de obra': 'bg-yellow-700',
    
    // En ejecución de obra
    'Demolición': 'bg-red-500',
    'Excavación': 'bg-red-600',
    'AVO 1': 'bg-green-500',
    'AVO 2': 'bg-green-600',
    'AVO 3': 'bg-green-700',
    
    // Finalización
    'Conforme de obra': 'bg-emerald-600',
    'MH-SUBDIVISION': 'bg-emerald-700',
    
    // Compatibilidad temporal con etapas antiguas
    'Planificación': 'bg-gray-500',
    'Permisos': 'bg-yellow-500',
    'Finalización': 'bg-emerald-600'
  }
  return stageColors[stage] || 'bg-blue-500'
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
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Proyectos
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-lg text-gray-600">{project.dgro_file_number}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
              className="bg-red-600 hover:bg-red-700"
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