'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  User, 
  Plus, 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  X, 
  Search, 
  Building, 
  FileText,
  UserCheck,
  Calendar,
  Trash2,
  AlertTriangle,
  Users
} from 'lucide-react'
import { Client, CreateClientData, ClientReferente } from '@/lib/construction'

interface ClientManagementProps {
  clients: Client[]
  onCreateClient: (clientData: CreateClientData) => Promise<void>
  onUpdateClient?: (clientId: string, clientData: Partial<CreateClientData>) => Promise<void>
  onDeleteClient?: (clientId: string) => Promise<void>
}

export default function ClientManagement({ clients, onCreateClient, onUpdateClient, onDeleteClient }: ClientManagementProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState<CreateClientData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    cuit: '',
    website_url: '',
    referentes: [{ name: '', role: '' }],
    contact_person: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Filtrar clientes por búsqueda
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre/razón social es obligatorio'
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no tiene un formato válido'
    }

    // Validar que al menos el primer referente tenga nombre
    if (!formData.referentes || formData.referentes.length === 0 || !formData.referentes[0].name.trim()) {
      newErrors.referentes = 'Debe agregar al menos un referente'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      cuit: '',
      website_url: '',
      referentes: [{ name: '', role: '' }],
      contact_person: '',
      notes: ''
    })
    setErrors({})
    setShowCreateForm(false)
    setEditingClient(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      if (editingClient && onUpdateClient) {
        await onUpdateClient(editingClient.id, formData)
      } else {
        await onCreateClient(formData)
      }
      resetForm()
    } catch (error) {
      console.error('Error saving client:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEdit = (client: Client) => {
    setFormData({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      cuit: client.cuit || '',
      website_url: client.website_url || '',
      referentes: client.referentes && client.referentes.length > 0 
        ? client.referentes 
        : [{ name: client.contact_person || '', role: '' }],
      contact_person: client.contact_person || '',
      notes: client.notes || ''
    })
    setEditingClient(client)
    setShowCreateForm(true)
  }

  const handleInputChange = (field: keyof CreateClientData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleReferenteChange = (index: number, field: keyof ClientReferente, value: string) => {
    setFormData(prev => ({
      ...prev,
      referentes: prev.referentes?.map((ref, i) => 
        i === index ? { ...ref, [field]: value } : ref
      ) || []
    }))
  }

  const addReferente = () => {
    setFormData(prev => ({
      ...prev,
      referentes: [...(prev.referentes || []), { name: '', role: '' }]
    }))
  }

  const removeReferente = (index: number) => {
    setFormData(prev => ({
      ...prev,
      referentes: prev.referentes?.filter((_, i) => i !== index) || []
    }))
  }

  const handleDeleteClient = async () => {
    if (!clientToDelete || !onDeleteClient) return
    
    setIsDeleting(true)
    try {
      await onDeleteClient(clientToDelete.id)
      setClientToDelete(null)
    } catch (error) {
      console.error('Error deleting client:', error)
      // Aquí podrías mostrar un toast o mensaje de error
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestión de Clientes</h2>
          <p className="text-muted-foreground">
            Administra los clientes y sus proyectos de construcción
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} disabled={showCreateForm} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Búsqueda */}
      {!showCreateForm && (
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar clientes por nombre, email o contacto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario de crear/editar cliente */}
      {showCreateForm && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {editingClient ? 'Actualiza la información del cliente' : 'Agrega un nuevo cliente a tu cartera'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-5 w-5" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información básica */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <h4 className="text-lg font-semibold">Información Básica</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="name">
                      Nombre/Razón Social <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ej: TABOADA CORA RAQUEL"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="email">Email de Contacto</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="cliente@email.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+54 11 1234-5678"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cuit">CUIT</Label>
                    <Input
                      id="cuit"
                      value={formData.cuit}
                      onChange={(e) => handleInputChange('cuit', e.target.value)}
                      placeholder="20-12345678-9"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address">Domicilio</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Av. Corrientes 1234, CABA"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="website_url">URL de su web</Label>
                    <Input
                      id="website_url"
                      value={formData.website_url}
                      onChange={(e) => handleInputChange('website_url', e.target.value)}
                      placeholder="https://www.empresa.com.ar"
                    />
                  </div>
                </div>
              </div>

              {/* Referentes */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h4 className="text-lg font-semibold">Referentes</h4>
                </div>
                
                <div className="space-y-3">
                  {formData.referentes?.map((referente, index) => (
                    <div key={index} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label htmlFor={`referente-name-${index}`}>
                          Nombre del Referente {index === 0 && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          id={`referente-name-${index}`}
                          value={referente.name}
                          onChange={(e) => handleReferenteChange(index, 'name', e.target.value)}
                          placeholder="Nombre completo"
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={`referente-role-${index}`}>
                          Rol/Descripción
                        </Label>
                        <Input
                          id={`referente-role-${index}`}
                          value={referente.role}
                          onChange={(e) => handleReferenteChange(index, 'role', e.target.value)}
                          placeholder="Ej: Director General, Gerente de Proyectos"
                        />
                      </div>
                      {formData.referentes && formData.referentes.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeReferente(index)}
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
                    onClick={addReferente}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Referente
                  </Button>
                </div>
              </div>

                             {/* Notas */}
               <div className="space-y-4">
                 <div className="md:col-span-2">
                   <Label htmlFor="notes">Notas y Observaciones</Label>
                   <Textarea
                     id="notes"
                     value={formData.notes}
                     onChange={(e) => handleInputChange('notes', e.target.value)}
                     placeholder="Información adicional sobre el cliente..."
                     rows={3}
                   />
                 </div>
               </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
                  {isSubmitting 
                    ? (editingClient ? 'Actualizando...' : 'Creando...') 
                    : (editingClient ? 'Actualizar Cliente' : 'Crear Cliente')
                  }
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de clientes */}
      {!showCreateForm && (
        <>
          {filteredClients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <Card key={client.id} className="hover:shadow-lg transition-all duration-300 group">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg leading-tight">{client.name}</h3>
                          <p className="text-sm text-muted-foreground">Cliente</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(client)}
                          title="Editar cliente"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {onDeleteClient && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setClientToDelete(client)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Eliminar cliente"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Referentes */}
                    {client.referentes && client.referentes.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>Referentes:</span>
                        </div>
                        {client.referentes.slice(0, 2).map((referente, index) => (
                          <div key={index} className="ml-6 text-sm">
                            <span className="font-medium">{referente.name}</span>
                            {referente.role && (
                              <span className="text-muted-foreground"> - {referente.role}</span>
                            )}
                          </div>
                        ))}
                        {client.referentes.length > 2 && (
                          <div className="ml-6 text-xs text-muted-foreground">
                            +{client.referentes.length - 2} referente(s) más
                          </div>
                        )}
                      </div>
                    )}

                    {/* Información de contacto */}
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">{client.email}</span>
                      </div>
                    )}
                    
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{client.phone}</span>
                      </div>
                    )}

                    {client.cuit && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">CUIT: {client.cuit}</span>
                      </div>
                    )}
                    
                    {client.address && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground text-sm leading-tight">{client.address}</span>
                      </div>
                    )}

                    {client.website_url && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={client.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 truncate text-sm"
                        >
                          {client.website_url}
                        </a>
                      </div>
                    )}

                    <Separator className="my-3" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Creado: {new Date(client.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Activo
                      </Badge>
                    </div>

                    {client.notes && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">Notas</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{client.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm 
                    ? 'Intenta ajustar los términos de búsqueda' 
                    : 'Comienza agregando tu primer cliente para gestionar proyectos'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primer Cliente
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el cliente{' '}
              <span className="font-semibold">{clientToDelete?.name}</span>?
              <br />
              <br />
              Esta acción no se puede deshacer. Si el cliente tiene proyectos asociados, 
              no podrá ser eliminado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClientToDelete(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClient}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 