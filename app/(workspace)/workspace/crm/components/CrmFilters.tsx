'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'
import { SOURCE_OPTIONS } from '../constants'

export interface FilterState {
  source?: string
  tag?: string
  hasContacts?: 'all' | 'with' | 'without'
  dateFrom?: string
  dateTo?: string
}

interface CrmFiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

const HAS_CONTACTS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'with', label: 'Con contactos' },
  { value: 'without', label: 'Sin contactos' },
]

export function CrmFilters({ filters, onChange }: CrmFiltersProps) {
  const hasActiveFilters = filters.source || filters.tag || (filters.hasContacts && filters.hasContacts !== 'all') || filters.dateFrom || filters.dateTo

  const clearFilters = () => {
    onChange({})
  }

  return (
    <div className="bg-muted/50 rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Filtros avanzados</span>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
            <X className="h-3 w-3 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Origen */}
        <div className="space-y-1.5">
          <Label className="text-xs">Origen</Label>
          <Select
            value={filters.source || '_all'}
            onValueChange={(v) => onChange({ ...filters, source: v === '_all' ? undefined : v })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos</SelectItem>
              {SOURCE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Etiqueta */}
        <div className="space-y-1.5">
          <Label className="text-xs">Etiqueta</Label>
          <Input
            value={filters.tag || ''}
            onChange={(e) => onChange({ ...filters, tag: e.target.value || undefined })}
            placeholder="Buscar por tag..."
            className="h-8 text-sm"
          />
        </div>

        {/* Con/Sin contactos */}
        <div className="space-y-1.5">
          <Label className="text-xs">Contactos</Label>
          <Select
            value={filters.hasContacts || 'all'}
            onValueChange={(v) => onChange({ ...filters, hasContacts: v as FilterState['hasContacts'] })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HAS_CONTACTS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fecha desde */}
        <div className="space-y-1.5">
          <Label className="text-xs">Desde</Label>
          <Input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || undefined })}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  )
}
