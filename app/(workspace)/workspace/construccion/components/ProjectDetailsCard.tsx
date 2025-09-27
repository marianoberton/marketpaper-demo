'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DollarSign } from 'lucide-react'
import { Project } from '@/lib/construction'

interface ProjectDetailsCardProps {
  project: Project
  isEditing: boolean
  editedProject: Project
  setEditedProject: (project: Project | ((prev: Project) => Project)) => void
}

export default function ProjectDetailsCard({ 
  project, 
  isEditing, 
  editedProject, 
  setEditedProject 
}: ProjectDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Detalles
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Presupuesto</Label>
            {isEditing ? (
              <Input
                type="number"
                value={editedProject.budget || ''}
                onChange={(e) => setEditedProject(prev => ({
                  ...prev,
                  budget: parseFloat(e.target.value) || 0
                }))}
                className="mt-1"
              />
            ) : (
              <p className="font-semibold text-lg">${project.budget?.toLocaleString()}</p>
            )}
          </div>
          
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Fecha de inicio</Label>
            {isEditing ? (
              <Input
                type="date"
                value={editedProject.start_date || ''}
                onChange={(e) => setEditedProject(prev => ({
                  ...prev,
                  start_date: e.target.value
                }))}
                className="mt-1"
              />
            ) : (
              <p className="font-semibold">{project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'}</p>
            )}
          </div>
          
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Fecha estimada de fin</Label>
            {isEditing ? (
              <Input
                type="date"
                value={editedProject.end_date || ''}
                onChange={(e) => setEditedProject(prev => ({
                  ...prev,
                  end_date: e.target.value
                }))}
                className="mt-1"
              />
            ) : (
              <p className="font-semibold">{project.end_date ? new Date(project.end_date).toLocaleDateString() : '-'}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}