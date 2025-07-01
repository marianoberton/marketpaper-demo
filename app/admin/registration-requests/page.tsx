'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CalendarDays, Mail, Phone, Building2, User, RefreshCw, Settings, CheckCircle, XCircle, UserPlus } from 'lucide-react'

interface RegistrationRequest {
  id: string
  full_name: string
  email: string
  company_name: string
  phone: string
  status: 'pending' | 'approved' | 'rejected' | 'processed'
  requested_at: string
  metadata?: any
}

interface Company {
  id: string
  name: string
  status: string
}

interface ProcessRequestData {
  action: 'create_super_admin' | 'assign_to_company' | 'create_new_company' | 'reject'
  company_id?: string
  new_company_name?: string
  role?: string
  notes?: string
}

export default function RegistrationRequestsPage() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null)
  const [processModalOpen, setProcessModalOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processData, setProcessData] = useState<ProcessRequestData>({
    action: 'assign_to_company',
    role: 'employee'
  })

  const loadRequests = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/registration-requests')
      const data = await response.json()
      
      if (response.ok) {
        setRequests(data.requests || [])
      } else {
        setError(data.error || 'Error cargando solicitudes')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const loadCompanies = async () => {
    try {
      const response = await fetch('/api/admin/companies')
      const data = await response.json()
      
      if (response.ok) {
        // El API devuelve un array directamente, no un objeto con companies
        setCompanies(Array.isArray(data) ? data : [])
        console.log('📊 Compañías cargadas:', data.length || 0)
      } else {
        console.error('Error en respuesta del API:', data)
      }
    } catch (err) {
      console.error('Error cargando compañías:', err)
    }
  }

  useEffect(() => {
    loadRequests()
    loadCompanies()
  }, [])

  const handleProcessRequest = (request: RegistrationRequest) => {
    setSelectedRequest(request)
    setProcessData({
      action: 'assign_to_company',
      role: 'employee',
      new_company_name: request.company_name
    })
    setProcessModalOpen(true)
  }

  const processRequest = async () => {
    if (!selectedRequest) return

    setProcessing(true)
    try {
      const response = await fetch('/api/admin/process-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          ...processData
        }),
      })

      const result = await response.json()

      if (response.ok) {
        // Actualizar la lista de solicitudes
        await loadRequests()
        setProcessModalOpen(false)
        setSelectedRequest(null)
      } else {
        setError(result.error || 'Error procesando solicitud')
      }
    } catch (err) {
      setError('Error de conexión al procesar solicitud')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      processed: 'bg-blue-100 text-blue-800 border-blue-300'
    }
    
    const labels = {
      pending: 'Pendiente',
      approved: 'Aprobada',
      rejected: 'Rechazada',
      processed: 'Procesada'
    }
    
    return (
      <Badge className={`${styles[status as keyof typeof styles]} border`}>
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      company_owner: 'Dueño de Compañía',
      company_admin: 'Admin de Compañía',
      manager: 'Gerente',
      employee: 'Empleado',
      viewer: 'Visualizador'
    }
    return roleNames[role as keyof typeof roleNames] || role
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Registro</h1>
            <p className="text-gray-600">Gestiona las solicitudes de acceso a la plataforma</p>
          </div>
        </div>
        
        <div className="flex justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Registro</h1>
          <p className="text-gray-600">Gestiona las solicitudes de acceso a la plataforma</p>
        </div>
        <Button onClick={loadRequests} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">❌ {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CalendarDays className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Procesadas</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'processed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Mail className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Esta semana</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => {
                    const weekAgo = new Date()
                    weekAgo.setDate(weekAgo.getDate() - 7)
                    return new Date(r.requested_at) > weekAgo
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes</h3>
              <p className="text-gray-600">
                Las solicitudes de registro aparecerán aquí cuando los usuarios completen el formulario.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{request.full_name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(request.status)}
                    {request.status === 'pending' && (
                      <Button
                        onClick={() => handleProcessRequest(request)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Procesar
                      </Button>
                    )}
                  </div>
                </div>
                <CardDescription>
                  Solicitado el {formatDate(request.requested_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{request.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{request.company_name}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{request.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">ID: {request.id.slice(0, 8)}...</span>
                    </div>
                  </div>
                </div>
                
                {request.metadata && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">
                      <strong>Metadata:</strong> IP: {request.metadata.ip || 'N/A'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Process Request Modal */}
      <Dialog open={processModalOpen} onOpenChange={setProcessModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Procesar Solicitud de Registro</DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>¿Cómo deseas procesar la solicitud de <strong>{selectedRequest.full_name}</strong>?</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Action Selection */}
            <div className="space-y-2">
              <Label htmlFor="action">Acción</Label>
              <Select 
                value={processData.action} 
                onValueChange={(value: any) => setProcessData({...processData, action: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una acción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create_super_admin">
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Crear Super Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="assign_to_company">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Asignar a Compañía Existente
                    </div>
                  </SelectItem>
                  <SelectItem value="create_new_company">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Crear Nueva Compañía
                    </div>
                  </SelectItem>
                  <SelectItem value="reject">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Rechazar Solicitud
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Company Selection (for assign_to_company) */}
            {processData.action === 'assign_to_company' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="company">Compañía</Label>
                  <Select 
                    value={processData.company_id} 
                    onValueChange={(value) => setProcessData({...processData, company_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una compañía" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.filter(c => c.status === 'active').map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select 
                    value={processData.role} 
                    onValueChange={(value) => setProcessData({...processData, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company_admin">Admin de Compañía</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="employee">Empleado</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* New Company Name (for create_new_company) */}
            {processData.action === 'create_new_company' && (
              <div className="space-y-2">
                <Label htmlFor="new_company_name">Nombre de la Nueva Compañía</Label>
                <Input
                  id="new_company_name"
                  value={processData.new_company_name || selectedRequest?.company_name || ''}
                  onChange={(e) => setProcessData({...processData, new_company_name: e.target.value})}
                  placeholder="Nombre de la compañía"
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={processData.notes || ''}
                onChange={(e) => setProcessData({...processData, notes: e.target.value})}
                placeholder="Notas adicionales..."
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setProcessModalOpen(false)}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={processRequest}
              disabled={processing || (processData.action === 'assign_to_company' && !processData.company_id)}
              className={processData.action === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {processing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : processData.action === 'reject' ? (
                <XCircle className="h-4 w-4 mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {processing ? 'Procesando...' : 
               processData.action === 'reject' ? 'Rechazar' : 'Procesar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 