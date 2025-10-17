'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building } from 'lucide-react'
import { Project } from '@/lib/construction'
import { DeadlineStatus } from './DeadlineStatus'
import ExpedientesManager from '@/components/ExpedientesManager'

interface ProjectGeneralInfoProps {
  project: Project
  isEditing: boolean
  editedProject: Project
  setEditedProject: (updater: (prev: Project) => Project) => void
  expedientes: any[]
  handleExpedientesChange: (expedientes: any[]) => void
  handleProjectReload: () => void
  getStatusColor: (status: string) => string
}

export default function ProjectGeneralInfo({
  project,
  isEditing,
  editedProject,
  setEditedProject,
  expedientes,
  handleExpedientesChange,
  handleProjectReload,
  getStatusColor
}: ProjectGeneralInfoProps) {

  return (
    <>
      {/* Información general */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Building className="h-5 w-5" />
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Plazo de Obra - Mostrar si hay documentos relacionados */}
          {(project.construction_start_date || project.construction_end_date || project.days_remaining !== undefined) && (
            <div className="mb-6">
              <DeadlineStatus
                daysRemaining={project.days_remaining ?? undefined}
                constructionEndDate={project.construction_end_date ?? undefined}
                constructionStartDate={project.construction_start_date ?? undefined}
                deadlineStatus={project.deadline_status as any}
                showProgress={true}
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="col-span-full">
                <ExpedientesManager
                  projectId={project.id}
                  expedientes={expedientes}
                  onExpedientesChange={handleExpedientesChange}
                  onProjectReload={handleProjectReload}
                  readOnly={!isEditing}
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Dirección</Label>
                {isEditing ? (
                  <Input
                    value={editedProject.address || ''}
                    onChange={(e) => setEditedProject(prev => ({
                      ...prev,
                      address: e.target.value
                    }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-semibold">{project.address}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Barrio</Label>
                {isEditing ? (
                  <Input
                    value={editedProject.barrio || ''}
                    onChange={(e) => setEditedProject(prev => ({
                      ...prev,
                      barrio: e.target.value
                    }))}
                    className="mt-1"
                    placeholder="Ej: Palermo"
                  />
                ) : (
                  <p className="font-semibold">{project.barrio || 'No especificado'}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Ciudad</Label>
                {isEditing ? (
                  <Input
                    value={editedProject.ciudad || ''}
                    onChange={(e) => setEditedProject(prev => ({
                      ...prev,
                      ciudad: e.target.value
                    }))}
                    className="mt-1"
                    placeholder="Ej: CABA"
                  />
                ) : (
                  <p className="font-semibold">{project.ciudad || 'No especificado'}</p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Superficie a construir</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editedProject.surface || ''}
                    onChange={(e) => setEditedProject(prev => ({
                      ...prev,
                      surface: parseFloat(e.target.value) || 0
                    }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-semibold">{project.surface?.toLocaleString()} m²</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Director de Obra</Label>
                {isEditing ? (
                  <Input
                    value={editedProject.director_obra || editedProject.architect || ''}
                    onChange={(e) => setEditedProject(prev => ({
                      ...prev,
                      director_obra: e.target.value
                    }))}
                    className="mt-1"
                    placeholder="Nombre del director de obra"
                  />
                ) : (
                  <p className="font-semibold">{project.director_obra || project.architect || 'No especificado'}</p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Constructor</Label>
                {isEditing ? (
                  <Input
                    value={editedProject.builder || ''}
                    onChange={(e) => setEditedProject(prev => ({
                      ...prev,
                      builder: e.target.value
                    }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-semibold">{project.builder}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Tipo de obra</Label>
                {isEditing ? (
                  <Select
                    value={editedProject.project_type || ''}
                    onValueChange={(value) => setEditedProject(prev => ({
                      ...prev,
                      project_type: value
                    }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Microobra">Microobra</SelectItem>
                      <SelectItem value="Obra Menor">Obra Menor</SelectItem>
                      <SelectItem value="Obra Media">Obra Media</SelectItem>
                      <SelectItem value="Obra Mayor">Obra Mayor</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-semibold">{project.project_type}</p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Tipo de Uso</Label>
                {isEditing ? (
                  <Select
                    value={editedProject.project_usage || editedProject.project_use || ''}
                    onValueChange={(value) => setEditedProject(prev => ({
                      ...prev,
                      project_usage: value
                    }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vivienda">Vivienda</SelectItem>
                      <SelectItem value="Comercial">Comercial</SelectItem>
                      <SelectItem value="Industrial">Industrial</SelectItem>
                      <SelectItem value="Mixto">Mixto</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-semibold">{project.project_usage || project.project_use}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}