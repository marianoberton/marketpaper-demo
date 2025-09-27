'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building, User, Plus, X } from 'lucide-react'
import { Project, ProjectProfessional } from '@/lib/construction'
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
  
  const handleProfesionalChange = (index: number, field: keyof ProjectProfessional, value: string): void => {
    setEditedProject(prev => ({
      ...prev,
      profesionales: prev.profesionales?.map((prof, i) => 
        i === index ? { ...prof, [field]: value } : prof
      ) || []
    }))
  }

  const addProfesional = (): void => {
    setEditedProject(prev => ({
      ...prev,
      profesionales: [
        ...(prev.profesionales || []),
        { name: '', role: 'Estructuralista' as ProjectProfessional['role'] }
      ]
    }))
  }

  const removeProfesional = (index: number): void => {
    setEditedProject(prev => ({
      ...prev,
      profesionales: prev.profesionales?.filter((_, i) => i !== index) || []
    }))
  }

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
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Estado del trámite</Label>
                <div className="mt-1">
                  <Badge className={`${getStatusColor(project.permit_status || '')} text-white`}>
                    {project.permit_status || 'Pendiente'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Estado de la Boleta</Label>
                <div className="mt-1">
                  <Badge className="bg-green-500 text-white">Pagado</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Otros Profesionales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <User className="h-5 w-5" />
            Otros Profesionales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-3">
                {editedProject.profesionales?.map((profesional, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label htmlFor={`profesional-name-${index}`}>
                        Nombre del Profesional
                      </Label>
                      <Input
                        id={`profesional-name-${index}`}
                        value={profesional.name}
                        onChange={(e) => handleProfesionalChange(index, 'name', e.target.value)}
                        placeholder="Nombre completo"
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`profesional-role-${index}`}>
                        Especialidad/Rol
                      </Label>
                      <Select
                        value={profesional.role}
                        onValueChange={(value) => handleProfesionalChange(index, 'role', value as ProjectProfessional['role'])}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Estructuralista">Estructuralista</SelectItem>
                          <SelectItem value="Proyectista">Proyectista</SelectItem>
                          <SelectItem value="Instalación Electrica">Instalación Eléctrica</SelectItem>
                          <SelectItem value="Instalación Sanitaria">Instalación Sanitaria</SelectItem>
                          <SelectItem value="Instalación e incendios">Instalación e Incendios</SelectItem>
                          <SelectItem value="Instalación e elevadores">Instalación e Elevadores</SelectItem>
                          <SelectItem value="Instalación Sala de maquinas">Instalación Sala de Máquinas</SelectItem>
                          <SelectItem value="Instalación Ventilación Mecanica">Instalación Ventilación Mecánica</SelectItem>
                          <SelectItem value="Instalación ventilación electromecánica">Instalación Ventilación Electromecánica</SelectItem>
                          <SelectItem value="Agrimensor">Agrimensor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {editedProject.profesionales && editedProject.profesionales.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeProfesional(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addProfesional}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Profesional
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {project.profesionales && project.profesionales.length > 0 ? (
                project.profesionales.map((profesional, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{profesional.name}</p>
                      <p className="text-sm text-muted-foreground">{profesional.role}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No hay profesionales adicionales registrados
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}