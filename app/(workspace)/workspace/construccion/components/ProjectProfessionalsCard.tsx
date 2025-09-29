'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Building, Plus, X } from 'lucide-react'
import { Project, ProjectProfessional } from '@/lib/construction'

interface ProjectProfessionalsCardProps {
  project: Project
  isEditing: boolean
  editedProject: Project
  setEditedProject: (project: Project | ((prev: Project) => Project)) => void
}

export default function ProjectProfessionalsCard({ 
  project, 
  isEditing, 
  editedProject, 
  setEditedProject 
}: ProjectProfessionalsCardProps) {
  
  // Funciones para manejar profesionales
  const handleProfesionalChange = (index: number, field: 'name' | 'role', value: string) => {
    setEditedProject(prev => {
      const newProfesionales = [...(prev.profesionales || [])]
      newProfesionales[index] = {
        ...newProfesionales[index],
        [field]: value
      }
      return {
        ...prev,
        profesionales: newProfesionales
      }
    })
  }

  const addProfesional = () => {
    setEditedProject(prev => ({
      ...prev,
      profesionales: [...(prev.profesionales || []), { name: '', role: 'Estructuralista' as const }]
    }))
  }

  const removeProfesional = (index: number) => {
    setEditedProject(prev => ({
      ...prev,
      profesionales: (prev.profesionales || []).filter((_, i) => i !== index)
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Profesionales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Director de Obra */}
          <div className="border-b pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Director de Obra</p>
                <p className="text-xs text-muted-foreground">
                  {project.director_obra || project.architect || 'No asignado'}
                </p>
              </div>
              <Badge variant="default" className="text-xs">
                Principal
              </Badge>
            </div>
          </div>

          {/* Constructor */}
          {project.builder && (
            <div className="border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Building className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Constructor</p>
                  <p className="text-xs text-muted-foreground">
                    {project.builder}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Empresa
                </Badge>
              </div>
            </div>
          )}

          {/* Otros Profesionales */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">Otros Profesionales</h4>
              {isEditing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addProfesional}
                  className="h-7 px-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar
                </Button>
              )}
            </div>

            {isEditing ? (
              // Modo edición
              <div className="space-y-3">
                {(editedProject.profesionales || []).map((profesional, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Nombre del profesional"
                        value={profesional.name}
                        onChange={(e) => handleProfesionalChange(index, 'name', e.target.value)}
                        className="h-8"
                      />
                      <Select
                        value={profesional.role}
                        onValueChange={(value) => handleProfesionalChange(index, 'role', value)}
                      >
                        <SelectTrigger className="h-8">
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeProfesional(index)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {(!editedProject.profesionales || editedProject.profesionales.length === 0) && (
                  <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      No hay profesionales adicionales
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Haz clic en "Agregar" para añadir profesionales
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Modo visualización
              <>
                {project.profesionales && project.profesionales.length > 0 ? (
                  <div className="space-y-3">
                    {project.profesionales.map((profesional, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{profesional.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {profesional.role}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Especialista
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      No hay profesionales adicionales asignados
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Profesional Legacy (inspector_name) para compatibilidad */}
          {project.inspector_name && !project.profesionales?.length && (
            <div className="border-t pt-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{project.inspector_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Inspector/Especialista
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Legacy
                </Badge>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}