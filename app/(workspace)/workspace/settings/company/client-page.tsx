'use client'

import { useWorkspace } from '@/components/workspace-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'
import { Building2, Users, Calendar, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function CompanySettingsClientPage() {
  const { companyName, companyId, userRole, userName, isLoading } = useWorkspace()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: companyName || '',
    domain: '',
    billing_email: '',
    timezone: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: formData.name,
          domain: formData.domain,
          billing_email: formData.billing_email,
          timezone: formData.timezone,
          updated_at: new Date().toISOString()
        })
        .eq('id', companyId)

      if (error) throw error

      setSuccess('Información de empresa actualizada exitosamente')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!companyName) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No se pudo cargar la información de la empresa</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración de Empresa</h1>
        <p className="text-muted-foreground">
          Gestiona la información y configuración de tu empresa
        </p>
      </div>

      {/* Company Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresa</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyName}</div>
            <p className="text-xs text-muted-foreground">
              ID: {companyId}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tu Rol</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={userRole === 'owner' ? 'default' : 'secondary'}>
                {userRole || 'member'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuario</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userName || 'Usuario'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Information Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Información de la Empresa
          </CardTitle>
          <CardDescription>
            Actualiza los detalles de tu empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre de la Empresa</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Mi Empresa"
                  required
                />
              </div>

              <div>
                <Label htmlFor="domain">Dominio</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({...formData, domain: e.target.value})}
                  placeholder="miempresa.com"
                />
              </div>

              <div>
                <Label htmlFor="billing_email">Email de Facturación</Label>
                <Input
                  id="billing_email"
                  type="email"
                  value={formData.billing_email}
                  onChange={(e) => setFormData({...formData, billing_email: e.target.value})}
                  placeholder="facturacion@miempresa.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="timezone">Zona Horaria</Label>
              <Input
                id="timezone"
                value={formData.timezone}
                onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                placeholder="America/Argentina/Buenos_Aires"
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </form>

          {success && (
            <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded text-green-700">
              {success}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID de Empresa:</span>
              <span className="font-mono">{companyId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan:</span>
              <Badge variant="outline">{companyName || 'Free'}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última actualización:</span>
              <span>{new Date(companyName || '').toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
