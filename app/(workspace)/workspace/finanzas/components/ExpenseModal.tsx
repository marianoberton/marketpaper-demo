'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CalendarIcon, X, Upload, DollarSign, Tag, CreditCard, Receipt, Repeat } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Expense {
  id: string
  company_id: string
  amount: number
  description: string
  category_id: string
  category_name?: string
  date: string
  payment_method: 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'other'
  receipt_url?: string
  notes?: string
  tags?: string[]
  is_recurring: boolean
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  created_at: string
  updated_at: string
}

interface Category {
  id: string
  company_id: string
  name: string
  description?: string
  color: string
  icon?: string
  parent_id?: string
  is_active: boolean
  budget_limit?: number
  created_at: string
  updated_at: string
}

interface ExpenseModalProps {
  expense?: Expense | null
  categories: Category[]
  onSave: (expense: Omit<Expense, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => void
  onCancel: () => void
}

const PAYMENT_METHODS = [
  { value: 'credit_card', label: 'Tarjeta de Crédito', icon: '💳' },
  { value: 'debit_card', label: 'Tarjeta de Débito', icon: '💳' },
  { value: 'cash', label: 'Efectivo', icon: '💵' },
  { value: 'bank_transfer', label: 'Transferencia Bancaria', icon: '🏦' },
  { value: 'other', label: 'Otros', icon: '💰' }
]

const RECURRING_FREQUENCIES = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'yearly', label: 'Anual' }
]

export default function ExpenseModal({ expense, categories, onSave, onCancel }: ExpenseModalProps) {
  const [formData, setFormData] = useState({
    amount: 0,
    description: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'credit_card' as 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'other',
    receipt_url: '',
    notes: '',
    tags: [] as string[],
    is_recurring: false,
    recurring_frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly'
  })

  const [newTag, setNewTag] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Cargar datos del gasto al editar
  useEffect(() => {
    if (expense) {
      setFormData({
        amount: expense.amount,
        description: expense.description,
        category_id: expense.category_id,
        date: expense.date,
        payment_method: expense.payment_method,
        receipt_url: expense.receipt_url || '',
        notes: expense.notes || '',
        tags: expense.tags || [],
        is_recurring: expense.is_recurring,
        recurring_frequency: expense.recurring_frequency || 'monthly'
      })
    }
  }, [expense])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'receipt')

      const response = await fetch('/api/workspace/finanzas/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Error al subir el archivo')
      }

      const data = await response.json()
      handleInputChange('receipt_url', data.url)
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida'
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Selecciona una categoría'
    }

    if (!formData.date) {
      newErrors.date = 'La fecha es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    onSave({
      ...formData,
      category_name: categories.find(cat => cat.id === formData.category_id)?.name
    })
  }

  const selectedCategory = categories.find(cat => cat.id === formData.category_id)

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {expense ? 'Editar Gasto' : 'Nuevo Gasto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Monto y descripción */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount || ''}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  className={cn('pl-10', errors.amount && 'border-red-500')}
                />
              </div>
              {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={cn(errors.date && 'border-red-500')}
              />
              {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Input
              id="description"
              placeholder="Ej: Almuerzo en restaurante"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={cn(errors.description && 'border-red-500')}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>

          {/* Categoría y método de pago */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => handleInputChange('category_id', value)}
              >
                <SelectTrigger className={cn(errors.category_id && 'border-red-500')}>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <span style={{ color: category.color }}>●</span>
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && <p className="text-sm text-red-500">{errors.category_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Método de Pago</Label>
              <Select 
                value={formData.payment_method} 
                onValueChange={(value) => handleInputChange('payment_method', value as 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'other')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(method => (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        <span>{method.icon}</span>
                        <span>{method.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recibo */}
          <div className="space-y-2">
            <Label htmlFor="receipt">Recibo/Comprobante</Label>
            <div className="flex items-center gap-2">
              <Input
                id="receipt"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setReceiptFile(file)
                    handleFileUpload(file)
                  }
                }}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('receipt')?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Subiendo...' : 'Subir Recibo'}
              </Button>
              {formData.receipt_url && (
                <a
                  href={formData.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  <Receipt className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Etiquetas</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Agregar etiqueta"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" onClick={handleAddTag} size="sm">
                Agregar
              </Button>
            </div>
          </div>

          {/* Gasto recurrente */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Gasto Recurrente</Label>
                <p className="text-sm text-gray-600">
                  Marcar si este gasto se repite periódicamente
                </p>
              </div>
              <Switch
                checked={formData.is_recurring}
                onCheckedChange={(checked) => handleInputChange('is_recurring', checked)}
              />
            </div>
            
            {formData.is_recurring && (
              <div className="space-y-2">
                <Label>Frecuencia</Label>
                <Select 
                  value={formData.recurring_frequency} 
                  onValueChange={(value) => handleInputChange('recurring_frequency', value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRING_FREQUENCIES.map(freq => (
                      <SelectItem key={freq.value} value={freq.value}>
                        <div className="flex items-center gap-2">
                          <Repeat className="h-4 w-4" />
                          <span>{freq.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionales</Label>
            <Textarea
              id="notes"
              placeholder="Notas opcionales sobre este gasto..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          {/* Vista previa de categoría seleccionada */}
          {selectedCategory && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: selectedCategory.color }}>●</span>
                <span>{selectedCategory.icon}</span>
                <span className="font-medium">{selectedCategory.name}</span>
              </div>
              {selectedCategory.description && (
                <p className="text-sm text-gray-600">{selectedCategory.description}</p>
              )}
              {selectedCategory.budget_limit && (
                <p className="text-sm text-gray-600 mt-1">
                  Presupuesto: ${selectedCategory.budget_limit.toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              {expense ? 'Actualizar' : 'Crear'} Gasto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 