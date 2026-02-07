'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useWorkspace } from '@/components/workspace-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Star,
  User,
  Camera
} from 'lucide-react'
import { toast } from 'sonner'
import { ClientCompanyForm } from '../components/ClientCompanyForm'
import { ContactPersonForm } from '../components/ContactPersonForm'
import { ClientTemasSection } from '../components/ClientTemasSection'
import { SOURCE_LABELS } from '../constants'

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  position: string | null
  is_primary: boolean
  notes: string | null
  source: string | null
  tags: string[]
  photo_url: string | null
  created_at: string
}

interface Tema {
  id: string
  title: string
  status: string
  priority: string
  reference_code: string | null
  due_date: string | null
  created_at: string
}

interface ClientDetail {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  cuit: string | null
  website_url: string | null
  notes: string | null
  source: string | null
  tags: string[]
  created_at: string
  updated_at: string
  contacts: Contact[]
  temas: Tema[]
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { companyId } = useWorkspace()
  const router = useRouter()
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAddContactOpen, setIsAddContactOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null)
  const [uploadingPhotoId, setUploadingPhotoId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoContactIdRef = useRef<string | null>(null)

  const fetchClient = async () => {
    if (!id) return
    try {
      setLoading(true)
      const response = await fetch(`/api/workspace/crm/${id}`)
      const result = await response.json()
      if (result.success) {
        setClient(result.data)
      } else {
        toast.error('Error al cargar los datos')
      }
    } catch (error) {
      console.error('Error fetching client:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClient()
  }, [id])

  const handleDeleteClient = async () => {
    if (!client) return
    if (!confirm(`¿Estás seguro de eliminar "${client.name}"? Esta acción no se puede deshacer.`)) return

    try {
      const response = await fetch(`/api/workspace/crm/${client.id}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        toast.success('Empresa eliminada')
        router.push(`/workspace/crm?company_id=${companyId}`)
      } else {
        toast.error(result.error || 'Error al eliminar')
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Error al eliminar')
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('¿Eliminar este contacto?')) return
    try {
      setDeletingContactId(contactId)
      const response = await fetch(`/api/workspace/crm/contacts/${contactId}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        toast.success('Contacto eliminado')
        fetchClient()
      } else {
        toast.error(result.error || 'Error al eliminar')
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
    } finally {
      setDeletingContactId(null)
    }
  }

  const handleClientUpdated = () => {
    setIsEditOpen(false)
    fetchClient()
    toast.success('Empresa actualizada')
  }

  const handleContactCreated = () => {
    setIsAddContactOpen(false)
    setEditingContact(null)
    fetchClient()
    toast.success(editingContact ? 'Contacto actualizado' : 'Contacto agregado')
  }

  const handlePhotoClick = (contactId: string) => {
    photoContactIdRef.current = contactId
    fileInputRef.current?.click()
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const contactId = photoContactIdRef.current
    if (!file || !contactId || !companyId) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Solo se permiten imágenes JPG, PNG o WebP')
      return
    }

    try {
      setUploadingPhotoId(contactId)
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `crm/${companyId}/${contactId}/${Date.now()}-photo.${ext}`

      // Get signed upload URL
      const urlRes = await fetch('/api/storage/create-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket: 'crm-photos', path, fileSize: file.size, mimeType: file.type })
      })
      const urlData = await urlRes.json()

      if (!urlRes.ok) {
        toast.error(urlData.error || 'Error al obtener URL de subida')
        return
      }

      // Upload file
      const uploadRes = await fetch(urlData.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      })

      if (!uploadRes.ok) {
        toast.error('Error al subir la imagen')
        return
      }

      // Build public URL
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/crm-photos/${path}`

      // Update contact with photo_url
      const updateRes = await fetch(`/api/workspace/crm/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: publicUrl })
      })

      if (updateRes.ok) {
        toast.success('Foto actualizada')
        fetchClient()
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast.error('Error al subir la foto')
    } finally {
      setUploadingPhotoId(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Empresa no encontrada</p>
        <Button variant="outline" onClick={() => router.push(`/workspace/crm?company_id=${companyId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al CRM
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/workspace/crm?company_id=${companyId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{client.name}</h1>
              <p className="text-sm text-muted-foreground">
                {client.contacts.length} contacto{client.contacts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="outline" className="text-destructive" onClick={handleDeleteClient}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información de la empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {client.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{client.address}</span>
              </div>
            )}
            {client.website_url && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a href={client.website_url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                  {client.website_url}
                </a>
              </div>
            )}
            {client.cuit && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground font-medium">CUIT:</span>
                <span>{client.cuit}</span>
              </div>
            )}
            {client.source && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground font-medium">Origen:</span>
                <Badge variant="outline">{SOURCE_LABELS[client.source] || client.source}</Badge>
              </div>
            )}
          </div>

          {/* Tags */}
          {client.tags && client.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t flex-wrap">
              <span className="text-sm text-muted-foreground font-medium">Etiquetas:</span>
              {client.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}

          {client.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">{client.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contacts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Contactos</h2>
          <Button onClick={() => { setEditingContact(null); setIsAddContactOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Contacto
          </Button>
        </div>

        {client.contacts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <User className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-3">No hay contactos registrados</p>
              <Button variant="outline" onClick={() => { setEditingContact(null); setIsAddContactOpen(true) }}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Contacto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {client.contacts.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Avatar with photo upload */}
                      <button
                        type="button"
                        className="relative w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden group flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); handlePhotoClick(contact.id) }}
                        disabled={uploadingPhotoId === contact.id}
                        title="Cambiar foto"
                      >
                        {uploadingPhotoId === contact.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : contact.photo_url ? (
                          <>
                            <img src={contact.photo_url} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera className="h-4 w-4 text-white" />
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="text-sm font-semibold">
                              {contact.first_name[0]}{contact.last_name[0]}
                            </span>
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera className="h-4 w-4 text-white" />
                            </div>
                          </>
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">
                            {contact.first_name} {contact.last_name}
                          </span>
                          {contact.is_primary && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Principal
                            </Badge>
                          )}
                          {contact.source && (
                            <Badge variant="outline" className="text-xs">
                              {SOURCE_LABELS[contact.source] || contact.source}
                            </Badge>
                          )}
                          {contact.tags?.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {contact.position && <span>{contact.position}</span>}
                          {contact.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {contact.email}
                            </span>
                          )}
                          {contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </span>
                          )}
                        </div>
                        {contact.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{contact.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingContact(contact)
                          setIsAddContactOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        disabled={deletingContactId === contact.id}
                        onClick={() => handleDeleteContact(contact.id)}
                      >
                        {deletingContactId === contact.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Temas asociados */}
      <ClientTemasSection temas={client.temas || []} clientName={client.name} />

      {/* Edit Company Dialog */}
      {isEditOpen && (
        <ClientCompanyForm
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          companyId={companyId || ''}
          onSuccess={handleClientUpdated}
          initialData={client}
        />
      )}

      {/* Add/Edit Contact Dialog */}
      <ContactPersonForm
        open={isAddContactOpen}
        onOpenChange={(open) => {
          setIsAddContactOpen(open)
          if (!open) setEditingContact(null)
        }}
        clientId={client.id}
        onSuccess={handleContactCreated}
        initialData={editingContact || undefined}
      />
    </div>
  )
}
