'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { User, Building, Plus, X, ChevronDown } from 'lucide-react'
import { Project, ProjectProfessional } from '@/lib/construction'
import { useState } from 'react'

const AVAILABLE_ROLES = [
  'Estructuralista',
  'Proyectista',
  'Instalación Eléctrica',
  'Instalación Sanitaria',
  'Instalación e Incendios',
  'Instalación e Elevadores',
  'Instalación Sala de Máquinas',
  'Instalación Ventilación Mecánica',
  'Instalación Ventilación Electromecánica',
  'Agrimensor'
]

interface MultiRoleSelectorProps {
  selectedRoles: string[]
  onRolesChange: (roles: string[]) => void
}

function MultiRoleSelector({ selectedRoles, onRolesChange }: MultiRoleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      onRolesChange(selectedRoles.filter(r => r !== role))
    } else {
      onRolesChange([...selectedRoles, role])
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="h-8 justify-between text-left font-normal"
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedRoles.length === 0 ? (
              <span className="text-muted-foreground">Seleccionar roles...</span>
            ) : selectedRoles.length === 1 ? (
              <span>{selectedRoles[0]}</span>
            ) : (
              <span>{selectedRoles.length} roles seleccionados</span>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2">
          <div className="text-sm font-medium mb-2">Seleccionar roles:</div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {AVAILABLE_ROLES.map((role) => (
              <div key={role} className="flex items-center space-x-2">
                <Checkbox
                  id={role}
                  checked={selectedRoles.includes(role)}
                  onCheckedChange={() => toggleRole(role)}
                />
                <label
                  htmlFor={role}
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {role}
                </label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

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
  const handleProfesionalChange = (index: number, field: 'name' | 'roles', value: string | string[]) => {
    setEditedProject(prev => {
      const newProfesionales = [...(prev.profesionales || [])]
      if (field === 'roles') {
        const validRoles = (value as string[]).filter(role => 
          ['Estructuralista', 'Proyectista', 'Instalación Electrica', 'Instalación Sanitaria', 'Instalación e incendios', 'Instalación e elevadores', 'Instalación Sala de maquinas', 'Instalación Ventilación Mecanica', 'Instalación ventilación electromecánica', 'Agrimensor'].includes(role)
        ) as ProjectProfessional['roles']
        
        newProfesionales[index] = {
          ...newProfesionales[index],
          roles: validRoles,
          role: validRoles[0] || 'Estructuralista' // Mantener compatibilidad
        }
      } else if (field === 'name') {
        newProfesionales[index] = {
          ...newProfesionales[index],
          name: value as string
        }
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
      profesionales: [...(prev.profesionales || []), { 
        name: '', 
        roles: ['Estructuralista'], 
        role: 'Estructuralista' // Mantener compatibilidad
      }]
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
                        <MultiRoleSelector
                          selectedRoles={profesional.roles || [profesional.role]}
                          onRolesChange={(roles) => handleProfesionalChange(index, 'roles', roles)}
                        />
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
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(profesional.roles || [profesional.role]).map((role, roleIndex) => (
                              <Badge key={roleIndex} variant="secondary" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
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