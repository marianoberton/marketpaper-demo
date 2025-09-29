'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react'
import { ProjectExpediente, CreateExpedienteData, UpdateExpedienteData, createExpediente, updateExpediente, deleteExpediente, getProjectById } from '@/lib/construction'
import { toast } from 'sonner'

interface ExpedientesManagerProps {
  projectId: string
  expedientes: ProjectExpediente[]
  onExpedientesChange: (expedientes: ProjectExpediente[]) => void
  onProjectReload?: () => void
  readOnly?: boolean
}

const EXPEDIENTE_TYPES = [
  { value: 'DGROC', label: 'DGROC' },
  { value: 'DGIUR', label: 'DGIUR' },
  { value: 'SSREGIC', label: 'SSREGIC' },
  { value: 'OTROS', label: 'Otros' }
]

const EXPEDIENTE_STATUS = [
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'En trámite', label: 'En trámite' },
  { value: 'Aprobado', label: 'Aprobado' },
  { value: 'Rechazado', label: 'Rechazado' }
]

export default function ExpedientesManager({
  projectId,
  expedientes,
  onExpedientesChange,
  onProjectReload,
  readOnly = false
}: ExpedientesManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newExpediente, setNewExpediente] = useState<Partial<CreateExpedienteData>>({
    expediente_number: ''
  })
  const [editingExpediente, setEditingExpediente] = useState<Partial<UpdateExpedienteData>>({})
  const [loading, setLoading] = useState(false)

  // Debug: Log de los expedientes recibidos
  console.log('🔍 DEBUG ExpedientesManager: projectId:', projectId)
  console.log('🔍 DEBUG ExpedientesManager: expedientes recibidos:', expedientes)
  console.log('🔍 DEBUG ExpedientesManager: expedientes.length:', expedientes?.length || 0)

  const handleAddExpediente = async () => {
    if (!newExpediente.expediente_number) {
      toast.error('Por favor ingrese el número de expediente')
      return
    }

    setLoading(true)
    try {
      // Si no hay projectId (durante la creación del proyecto), solo actualizar el estado local
      if (!projectId) {
        const newExpedienteLocal = {
          id: `temp-${Date.now()}`, // ID temporal
          expediente_number: newExpediente.expediente_number,
          expediente_type: 'DGROC',
          status: 'Pendiente',
          project_id: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          notes: null
        }
        
        const updatedExpedientes = [...expedientes, newExpedienteLocal]
        console.log('🔍 DEBUG: Actualizando expedientes localmente:', updatedExpedientes)
        onExpedientesChange(updatedExpedientes)
        
        setNewExpediente({
          expediente_number: ''
        })
        setIsAdding(false)
        toast.success('Expediente agregado correctamente')
        return
      }

      // Si hay projectId (editando proyecto existente), crear en la base de datos
      const expedienteData: CreateExpedienteData = {
        project_id: projectId,
        expediente_number: newExpediente.expediente_number,
        expediente_type: 'DGROC',
        status: 'Pendiente'
      }

      console.log('🔍 DEBUG: Creando expediente en BD:', expedienteData)
      const newExpedienteCreated = await createExpediente(expedienteData)
      console.log('🔍 DEBUG: Expediente creado:', newExpedienteCreated)
      
      // Actualizar inmediatamente el estado local con el nuevo expediente
      const updatedExpedientes = [...expedientes, newExpedienteCreated]
      console.log('🔍 DEBUG: Estado actual de expedientes:', expedientes)
      console.log('🔍 DEBUG: Nuevos expedientes a enviar:', updatedExpedientes)
      
      onExpedientesChange(updatedExpedientes)
      
      setNewExpediente({
        expediente_number: ''
      })
      setIsAdding(false)
      toast.success('Expediente agregado correctamente')
      
      // NO llamar a onProjectReload para evitar conflictos
      console.log('🔍 DEBUG: Expediente agregado sin recargar proyecto')
      
    } catch (error) {
      console.error('Error adding expediente:', error)
      toast.error('Error al agregar el expediente')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateExpediente = async (expedienteId: string) => {
    if (!editingExpediente.expediente_number) {
      toast.error('Por favor ingrese el número de expediente')
      return
    }

    setLoading(true)
    try {
      const updateData: UpdateExpedienteData = {
        id: expedienteId,
        ...editingExpediente
      }

      const updatedExpediente = await updateExpediente(updateData)
      const updatedExpedientes = expedientes.map(exp => 
        exp.id === expedienteId ? updatedExpediente : exp
      )
      onExpedientesChange(updatedExpedientes)
      
      setEditingId(null)
      setEditingExpediente({})
      toast.success('Expediente actualizado correctamente')
    } catch (error) {
      console.error('Error updating expediente:', error)
      toast.error('Error al actualizar el expediente')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExpediente = async (expedienteId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este expediente?')) {
      return
    }

    setLoading(true)
    try {
      await deleteExpediente(expedienteId)
      const updatedExpedientes = expedientes.filter(exp => exp.id !== expedienteId)
      onExpedientesChange(updatedExpedientes)
      toast.success('Expediente eliminado correctamente')
    } catch (error) {
      console.error('Error deleting expediente:', error)
      toast.error('Error al eliminar el expediente')
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (expediente: ProjectExpediente) => {
    setEditingId(expediente.id)
    setEditingExpediente({
      expediente_number: expediente.expediente_number,
      expediente_type: expediente.expediente_type,
      status: expediente.status
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingExpediente({})
  }



  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Expedientes</Label>
        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={isAdding || loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Expediente
          </Button>
        )}
      </div>

      {/* Lista de expedientes existentes */}
      <div className="space-y-3">
        {expedientes.map((expediente) => (
          <Card key={expediente.id} className="p-4">
            {editingId === expediente.id ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Número de Expediente</Label>
                  <Input
                    value={editingExpediente.expediente_number || ''}
                    onChange={(e) => setEditingExpediente(prev => ({
                      ...prev,
                      expediente_number: e.target.value
                    }))}
                    placeholder="EX-2024-12345678-GCABA-DGROC"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleUpdateExpediente(expediente.id)}
                    disabled={loading}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Guardar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={cancelEditing}
                    disabled={loading}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{expediente.expediente_number}</span>
                  </div>
                  {expediente.notes && (
                    <p className="text-sm text-muted-foreground">{expediente.notes}</p>
                  )}
                </div>
                {!readOnly && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(expediente)}
                      disabled={loading}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteExpediente(expediente.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Formulario para agregar nuevo expediente */}
      {isAdding && (
        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Número de Expediente *</Label>
              <Input
                value={newExpediente.expediente_number || ''}
                onChange={(e) => setNewExpediente(prev => ({
                  ...prev,
                  expediente_number: e.target.value
                }))}
                placeholder="EX-2024-12345678-GCABA-DGROC"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleAddExpediente}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAdding(false)
                  setNewExpediente({
                    expediente_number: ''
                  })
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {expedientes.length === 0 && !isAdding && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No hay expedientes registrados</p>
          {!readOnly && (
            <p className="text-sm">Haga clic en "Agregar Expediente" para comenzar</p>
          )}
        </div>
      )}
    </div>
  )
}