'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  User, 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  UserPlus
} from 'lucide-react'
import { Project, ProjectProfessional } from '@/lib/construction'

interface ProfessionalsProps {
  project: Project
  isEditing?: boolean
  editedProject?: Project
  setEditedProject?: (project: Project | ((prev: Project) => Project)) => void
}

const mainProfessionalRoles = [
  'Arquitecto',
  'Ingeniero Civil',
  'Director de Obra',
  'Constructor',
  'Proyectista',
  'Estructuralista'
] as const

const getRoleColor = (role: string) => {
  switch (role) {
    case 'Arquitecto': return 'bg-blue-100 text-blue-800'
    case 'Ingeniero Civil': return 'bg-green-100 text-green-800'
    case 'Director de Obra': return 'bg-purple-100 text-purple-800'
    case 'Constructor': return 'bg-orange-100 text-orange-800'
    case 'Proyectista': return 'bg-indigo-100 text-indigo-800'
    case 'Estructuralista': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'Arquitecto': return <Building className="h-4 w-4" />
    case 'Ingeniero Civil': return <User className="h-4 w-4" />
    case 'Director de Obra': return <UserPlus className="h-4 w-4" />
    case 'Constructor': return <Building className="h-4 w-4" />
    case 'Proyectista': return <User className="h-4 w-4" />
    case 'Estructuralista': return <Building className="h-4 w-4" />
    default: return <User className="h-4 w-4" />
  }
}

export default function Professionals({ 
  project, 
  isEditing = false, 
  editedProject, 
  setEditedProject 
}: ProfessionalsProps) {
  const [editingProfessional, setEditingProfessional] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProfessional, setNewProfessional] = useState<Partial<ProjectProfessional>>({
    name: '',
    role: 'Estructuralista'
  })

  const currentProject = editedProject || project
  const currentProfessionals = currentProject.profesionales || []
  
  // Filtrar solo los profesionales principales
  const mainProfessionals = currentProfessionals.filter(p => 
    mainProfessionalRoles.includes(p.role as any)
  )

  const handleAddProfessional = () => {
    if (!newProfessional.name || !newProfessional.role) return
    
    if (setEditedProject) {
      setEditedProject(prev => ({
        ...prev,
        profesionales: [...(prev.profesionales || []), newProfessional as ProjectProfessional]
      }))
    }

    setNewProfessional({ name: '', role: 'Estructuralista' })
    setShowAddForm(false)
  }

  const handleRemoveProfessional = (index: number) => {
    if (setEditedProject) {
      setEditedProject(prev => ({
        ...prev,
        profesionales: (prev.profesionales || []).filter((_, i) => i !== index)
      }))
    }
  }

  const handleUpdateProfessional = (index: number, field: keyof ProjectProfessional, value: string) => {
    if (setEditedProject) {
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
  }

  const ProfessionalCard = ({ 
    professional, 
    index
  }: { 
    professional: ProjectProfessional, 
    index: number
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${getRoleColor(professional.role || 'Estructuralista')}`}>
              {getRoleIcon(professional.role || 'Estructuralista')}
            </div>
            <div>
              {editingProfessional === index ? (
                <Input
                  value={professional.name}
                  onChange={(e) => handleUpdateProfessional(index, 'name', e.target.value)}
                  className="font-semibold mb-1"
                />
              ) : (
                <h3 className="font-semibold text-gray-900">{professional.name}</h3>
              )}
              <Badge className={`text-xs ${getRoleColor(professional.role || 'Estructuralista')}`}>
                {professional.role || 'Estructuralista'}
              </Badge>
            </div>
          </div>
          {isEditing && (
            <div className="flex gap-1">
              {editingProfessional === index ? (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 w-7 p-0"
                  onClick={() => setEditingProfessional(null)}
                >
                  <Save className="h-3 w-3" />
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 w-7 p-0"
                  onClick={() => setEditingProfessional(index)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                onClick={() => handleRemoveProfessional(index)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Building className="h-5 w-5" />
              Profesionales
            </CardTitle>
            <p className="text-gray-600 text-sm mt-1">
              Arquitectos, ingenieros, directores de obra y constructores principales
            </p>
          </div>
          {isEditing && (
            <Button 
              onClick={() => setShowAddForm(true)} 
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulario para agregar profesional */}
        {showAddForm && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Agregar Profesional</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setShowAddForm(false)}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre completo *</Label>
                  <Input
                    id="name"
                    value={newProfessional.name || ''}
                    onChange={(e) => setNewProfessional(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Rol *</Label>
                  <Select 
                    value={newProfessional.role} 
                    onValueChange={(value) => setNewProfessional(prev => ({ ...prev, role: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mainProfessionalRoles.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleAddProfessional} disabled={!newProfessional.name || !newProfessional.role}>
                  <Save className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de profesionales */}
        {mainProfessionals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mainProfessionals.map((professional, index) => {
              const originalIndex = currentProfessionals.findIndex(p => p === professional)
              return (
                <ProfessionalCard
                  key={originalIndex}
                  professional={professional}
                  index={originalIndex}
                />
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Building className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No hay profesionales principales asignados</p>
            {isEditing && (
              <Button 
                onClick={() => setShowAddForm(true)} 
                variant="outline" 
                size="sm" 
                className="mt-3"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primer Profesional
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}