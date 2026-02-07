'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { SOURCE_OPTIONS } from '../constants'
import { TagInput } from './TagInput'

interface ClientCompanyFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  onSuccess: () => void
  initialData?: {
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
  }
}

export function ClientCompanyForm({ open, onOpenChange, companyId, onSuccess, initialData }: ClientCompanyFormProps) {
  const isEditing = !!initialData
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    cuit: initialData?.cuit || '',
    website_url: initialData?.website_url || '',
    notes: initialData?.notes || '',
    source: initialData?.source || '',
    tags: initialData?.tags || [] as string[],
  })

  const handleSubmit = async () => {
    if (!form.name.trim()) return

    try {
      setLoading(true)

      const url = isEditing
        ? `/api/workspace/crm/${initialData.id}`
        : '/api/workspace/crm'

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          company_id: companyId,
        })
      })

      if (response.ok) {
        if (!isEditing) {
          setForm({ name: '', email: '', phone: '', address: '', cuit: '', website_url: '', notes: '', source: '', tags: [] })
        }
        onSuccess()
      }
    } catch (error) {
      console.error('Error saving client:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Empresa' : 'Nueva Empresa Cliente'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifica los datos de la empresa' : 'Agrega una nueva empresa cliente a tu CRM'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la empresa *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Constructora ABC S.A."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contacto@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+54 11 1234-5678"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cuit">CUIT</Label>
              <Input
                id="cuit"
                value={form.cuit}
                onChange={(e) => setForm({ ...form, cuit: e.target.value })}
                placeholder="30-12345678-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website_url">Sitio web</Label>
              <Input
                id="website_url"
                value={form.website_url}
                onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                placeholder="https://empresa.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Av. Corrientes 1234, CABA"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Origen</Label>
              <Select
                value={form.source || '_none'}
                onValueChange={(v) => setForm({ ...form, source: v === '_none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin especificar</SelectItem>
                  {SOURCE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Etiquetas</Label>
              <TagInput
                tags={form.tags}
                onChange={(tags) => setForm({ ...form, tags })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Información adicional..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !form.name.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Guardar cambios' : 'Crear Empresa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
