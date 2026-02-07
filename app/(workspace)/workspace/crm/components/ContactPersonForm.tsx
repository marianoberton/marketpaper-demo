'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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

interface ContactPersonFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  onSuccess: () => void
  initialData?: {
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
  }
}

export function ContactPersonForm({ open, onOpenChange, clientId, onSuccess, initialData }: ContactPersonFormProps) {
  const isEditing = !!initialData
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    position: initialData?.position || '',
    is_primary: initialData?.is_primary || false,
    notes: initialData?.notes || '',
    source: initialData?.source || '',
    tags: initialData?.tags || [] as string[],
  })

  const handleSubmit = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) return

    try {
      setLoading(true)

      const url = isEditing
        ? `/api/workspace/crm/contacts/${initialData.id}`
        : `/api/workspace/crm/${clientId}/contacts`

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (response.ok) {
        if (!isEditing) {
          setForm({ first_name: '', last_name: '', email: '', phone: '', position: '', is_primary: false, notes: '', source: '', tags: [] })
        }
        onSuccess()
      }
    } catch (error) {
      console.error('Error saving contact:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Contacto' : 'Nuevo Contacto'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifica los datos del contacto' : 'Agrega una persona de contacto a esta empresa'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre *</Label>
              <Input
                id="first_name"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="Juan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido *</Label>
              <Input
                id="last_name"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                placeholder="Pérez"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Cargo</Label>
            <Input
              id="position"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              placeholder="Ej: Director Comercial"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="juan@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Teléfono</Label>
              <Input
                id="contact_phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+54 11 1234-5678"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="is_primary"
              checked={form.is_primary}
              onCheckedChange={(checked) => setForm({ ...form, is_primary: checked })}
            />
            <Label htmlFor="is_primary">Contacto principal</Label>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="contact_notes">Notas</Label>
            <Textarea
              id="contact_notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Información adicional..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !form.first_name.trim() || !form.last_name.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Guardar cambios' : 'Agregar Contacto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
