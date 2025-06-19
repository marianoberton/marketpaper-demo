'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createUserAction, updateUserAction } from '@/app/admin/companies/[id]/actions'

interface UserData {
  email: string
  password?: string
  full_name: string
  role: string
}

interface UserFormDialogProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
  userToEdit?: UserData & { id: string } | null
}

export function UserFormDialog({ isOpen, onClose, companyId, userToEdit }: UserFormDialogProps) {
  const isEditMode = !!userToEdit

  const [formData, setFormData] = useState<UserData>({
    email: '',
    password: '',
    full_name: '',
    role: 'member',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        email: userToEdit.email,
        full_name: userToEdit.full_name,
        role: userToEdit.role,
        password: '', // Password is not edited here
      })
    } else {
      // Reset form for new user
      setFormData({ email: '', password: '', full_name: '', role: 'member' })
    }
  }, [userToEdit, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRoleChange = (value: string) => {
    setFormData({ ...formData, role: value })
  }
  
  const handleGeneratePassword = () => {
    const randomPassword = Math.random().toString(36).slice(-10) + 'A1!'
    setFormData({ ...formData, password: randomPassword })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const result = isEditMode
      ? await updateUserAction(userToEdit.id, companyId, {
          full_name: formData.full_name,
          role: formData.role,
        })
      : await createUserAction(companyId, formData)

    if (result.success) {
      onClose() // Let the revalidation handle the UI update
    } else {
      setError(result.message)
    }
    
    setIsLoading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Modifica los detalles del usuario.'
              : 'Crea un nuevo usuario y asígnalo a esta empresa.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Nombre Completo</Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isEditMode}
            />
          </div>
          {!isEditMode && (
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <div className="flex items-center space-x-2">
                  <Input
                  id="password"
                  name="password"
                  type="text"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  />
                  <Button type="button" variant="outline" onClick={handleGeneratePassword}>
                      Generar
                  </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                  Asegúrate de que la contraseña sea segura.
              </p>
            </div>
          )}
          <div>
            <Label htmlFor="role">Rol</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Propietario (Owner)</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="manager">Gerente (Manager)</SelectItem>
                <SelectItem value="member">Miembro (Member)</SelectItem>
                <SelectItem value="viewer">Solo Lectura (Viewer)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {error && <p className="text-sm text-red-500">{error}</p>}
          
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEditMode ? 'Guardando...' : 'Creando...'
                : isEditMode ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 