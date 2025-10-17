'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Plus, X } from 'lucide-react'
import { Project, ProjectProfessional } from '@/lib/construction'

interface ProfesionalesPrincipalesProps {
  project: Project
  isEditing: boolean
  editedProject: Project
  setEditedProject: (updater: (prev: Project) => Project) => void
}

export default function ProfesionalesPrincipales({
  project,
  isEditing,
  editedProject,
  setEditedProject
}: ProfesionalesPrincipalesProps) {
  
  const principalRoles = ['Estructuralista', 'Proyectista']
  
  const handleProfesionalChange = (index: number, field: keyof ProjectProfessional, value: string): void => {
    const allProfessionals = editedProject.profesionales || []
    const principalProfessionals = allProfessionals.filter(p => p.role && principalRoles.includes(p.role))
    const otherProfessionals = allProfessionals.filter(p => !p.role || !principalRoles.includes(p.role))
    
    const updatedPrincipalProfessionals = principalProfessionals.map((prof, i) => 
      i === index ? { ...prof, [field]: value } : prof
    )
    
    setEditedProject(prev => ({
      ...prev,
      profesionales: [...updatedPrincipalProfessionals, ...otherProfessionals]
    }))
  }

  const addProfesional = (): void => {
    const allProfessionals = editedProject.profesionales || []
    const otherProfessionals = allProfessionals.filter(p => !p.role || !principalRoles.includes(p.role))
    const principalProfessionals = allProfessionals.filter(p => p.role && principalRoles.includes(p.role))
    
    const newProfessional: ProjectProfessional = { 
      name: '', 
      role: 'Estructuralista' as ProjectProfessional['role'],
      roles: ['Estructuralista']
    }
    
    setEditedProject(prev => ({
      ...prev,
      profesionales: [...principalProfessionals, newProfessional, ...otherProfessionals]
    }))
  }

  const removeProfesional = (index: number): void => {
    const allProfessionals = editedProject.profesionales || []
    const principalProfessionals = allProfessionals.filter(p => p.role && principalRoles.includes(p.role))
    const otherProfessionals = allProfessionals.filter(p => !p.role || !principalRoles.includes(p.role))
    
    const updatedPrincipalProfessionals = principalProfessionals.filter((_, i) => i !== index)
    
    setEditedProject(prev => ({
      ...prev,
      profesionales: [...updatedPrincipalProfessionals, ...otherProfessionals]
    }))
  }

  const principalProfessionals = (project.profesionales || []).filter(p => p.role && principalRoles.includes(p.role))
  const editedPrincipalProfessionals = (editedProject.profesionales || []).filter(p => p.role && principalRoles.includes(p.role))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <User className="h-5 w-5" />
          Profesionales Principales
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-3">
              {editedPrincipalProfessionals.map((profesional, index) => (
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
                      value={profesional.role || ''}
                      onValueChange={(value) => handleProfesionalChange(index, 'role', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Estructuralista">Estructuralista</SelectItem>
                        <SelectItem value="Proyectista">Proyectista</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeProfesional(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
                Agregar Profesional Principal
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {principalProfessionals.length > 0 ? (
              principalProfessionals.map((profesional, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{profesional.name}</p>
                    <p className="text-sm text-muted-foreground">{profesional.role}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No hay profesionales principales registrados
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}