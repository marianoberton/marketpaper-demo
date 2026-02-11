'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/page-header'
import { toast } from 'sonner'
import { User, Save, Loader2, Calendar, Phone, Briefcase, Building2, Users } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  position: string | null
  department: string | null
  bio: string | null
  birthday: string | null
  gender: string | null
  avatar_url: string | null
  timezone: string | null
  locale: string | null
  role: string
  company_id: string
}

const genderOptions = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'non-binary', label: 'No binario' },
  { value: 'prefer-not-say', label: 'Prefiero no decir' },
  { value: 'other', label: 'Otro' }
]

export default function ProfileClientPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    position: '',
    department: '',
    bio: '',
    birthday: '',
    gender: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/profile')
      if (!response.ok) throw new Error('Error al cargar perfil')

      const data = await response.json()
      setProfile(data.profile)

      // Initialize form data
      setFormData({
        full_name: data.profile.full_name || '',
        phone: data.profile.phone || '',
        position: data.profile.position || '',
        department: data.profile.department || '',
        bio: data.profile.bio || '',
        birthday: data.profile.birthday || '',
        gender: data.profile.gender || ''
      })
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar el perfil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al actualizar perfil')
      }

      const data = await response.json()
      setProfile(data.profile)
      toast.success('Perfil actualizado correctamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar cambios')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 p-4 sm:p-6">
        <PageHeader
          title="Mi Perfil"
          description="Gestiona tu información personal"
          accentColor="primary"
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8 p-4 sm:p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Mi Perfil"
        description="Actualiza tu información personal y preferencias"
        accentColor="primary"
      />

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Básica
              </CardTitle>
              <CardDescription>
                Tu nombre y datos de contacto principales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">
                    Nombre completo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Teléfono
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+54 11 1234-5678"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gender">
                    Género
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange('gender', value)}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {genderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthday">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Fecha de nacimiento
                  </Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => handleInputChange('birthday', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">
                  Biografía
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Cuéntanos un poco sobre ti..."
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Esta información puede ser visible para otros miembros de tu equipo
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Información Laboral */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Información Laboral
              </CardTitle>
              <CardDescription>
                Tu puesto y área dentro de la empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="position">
                    <Briefcase className="h-4 w-4 inline mr-1" />
                    Puesto / Cargo
                  </Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    placeholder="Ej: Gerente de Ventas"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">
                    <Building2 className="h-4 w-4 inline mr-1" />
                    Departamento / Área
                  </Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="Ej: Comercial"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Cuenta (solo lectura) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Información de Cuenta
              </CardTitle>
              <CardDescription>
                Datos de tu cuenta (no editables)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <Input value={profile?.email || ''} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Rol</Label>
                  <Input
                    value={
                      profile?.role === 'company_owner' ? 'Propietario' :
                      profile?.role === 'company_admin' ? 'Administrador' :
                      profile?.role === 'manager' ? 'Manager' :
                      profile?.role === 'employee' ? 'Empleado' :
                      profile?.role === 'viewer' ? 'Portal Cliente' :
                      profile?.role || ''
                    }
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botón de guardar */}
          <div className="flex justify-end gap-3 sticky bottom-4 bg-background/95 backdrop-blur-sm py-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={fetchProfile}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar cambios
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
