'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'

// Etapas reorganizadas según nueva estructura
const projectPhases = [
  {
    name: 'Prefactibilidad del proyecto',
    stages: ['Prefactibilidad del proyecto']
  },
  {
    name: 'En Gestoria',
    stages: ['Consulta DGIUR', 'Permiso de Demolición', 'Registro etapa de proyecto', 'Permiso de obra']
  },
  {
    name: 'En ejecución de obra',
    stages: ['Alta Inicio de obra', 'Cartel de Obra', 'Demolición', 'Excavación', 'AVO 1', 'AVO 2', 'AVO 3']
  },
  {
    name: 'Finalización',
    stages: ['Conforme de obra', 'MH-SUBDIVISION']
  }
]

interface ProjectStagesProps {
  currentStage: string
  projectId: string
  onStageChange: (projectId: string, newStage: string) => void
}

export default function ProjectStages({ currentStage, projectId, onStageChange }: ProjectStagesProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Etapas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projectPhases.map((phase) => (
            <div key={phase.name} className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">{phase.name}</span>
              <div className="flex flex-wrap gap-1">
                {phase.stages.map((stage) => (
                  <Button
                    key={stage}
                    variant={currentStage === stage ? "default" : "outline"}
                    size="sm"
                    onClick={() => onStageChange(projectId, stage)}
                    className="text-xs h-8 flex-shrink-0"
                  >
                    {stage}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}