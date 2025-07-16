'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Plus, Edit, Trash2, Target, Palette, Tag, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface CategoryManagerProps {
  categories: Category[]
  onUpdate: () => void
}

const DEFAULT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#c026d3', '#ec4899', '#f43f5e', '#64748b'
]

const DEFAULT_ICONS = [
  '🍕', '🚗', '🏠', '💊', '📚', '🎬', '🛍️', '🔧', '💰', '📱',
  '⚡', '🎯', '🎨', '🏃', '🧳', '🎵', '📝', '🌟', '💡', '🔮'
]

export default function CategoryManager({ categories, onUpdate }: CategoryManagerProps) {
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: DEFAULT_COLORS[0],
    icon: DEFAULT_ICONS[0],
    parent_id: '',
    is_active: true,
    budget_limit: 0
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: DEFAULT_COLORS[0],
      icon: DEFAULT_ICONS[0],
      parent_id: '',
      is_active: true,
      budget_limit: 0
    })
    setErrors({})
    setEditingCategory(null)
  }

  const handleCreate = () => {
    resetForm()
    setShowModal(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
      icon: category.icon || DEFAULT_ICONS[0],
      parent_id: category.parent_id || '',
      is_active: category.is_active,
      budget_limit: category.budget_limit || 0
    })
    setShowModal(true)
  }

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (formData.budget_limit < 0) {
      newErrors.budget_limit = 'El presupuesto no puede ser negativo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSaving(true)
    try {
      const url = editingCategory 
        ? `/api/workspace/finanzas/categories/${editingCategory.id}`
        : '/api/workspace/finanzas/categories'
      
      const method = editingCategory ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Error al guardar la categoría')
      }

      setShowModal(false)
      resetForm()
      onUpdate()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Error al guardar la categoría')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      return
    }

    try {
      const response = await fetch(`/api/workspace/finanzas/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar la categoría')
      }

      onUpdate()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Error al eliminar la categoría')
    }
  }

  const handleToggleActive = async (categoryId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/workspace/finanzas/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: isActive }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar la categoría')
      }

      onUpdate()
    } catch (error) {
      console.error('Error updating category:', error)
      alert('Error al actualizar la categoría')
    }
  }

  // Categorías principales (sin padre)
  const parentCategories = categories.filter(cat => !cat.parent_id)
  
  // Categorías hijas agrupadas por padre
  const subcategoriesByParent = categories.reduce((acc, cat) => {
    if (cat.parent_id) {
      if (!acc[cat.parent_id]) {
        acc[cat.parent_id] = []
      }
      acc[cat.parent_id].push(cat)
    }
    return acc
  }, {} as Record<string, Category[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Categorías</h2>
          <p className="text-gray-600">Organiza y administra las categorías de tus gastos</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Categorías</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <Tag className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categorías Activas</p>
                <p className="text-2xl font-bold">{categories.filter(c => c.is_active).length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Presupuesto Total</p>
                <p className="text-2xl font-bold">
                  ${categories.reduce((sum, cat) => sum + (cat.budget_limit || 0), 0).toLocaleString()}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de categorías */}
      <div className="space-y-4">
        {parentCategories.map(category => (
          <Card key={category.id} className={cn(!category.is_active && 'opacity-60')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: category.color }}
                  >
                    <span className="text-white text-sm font-bold">
                      {category.icon || '●'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      {!category.is_active && (
                        <Badge variant="secondary">Inactiva</Badge>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-gray-600 text-sm">{category.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {category.budget_limit && (
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        ${category.budget_limit.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Presupuesto</p>
                    </div>
                  )}
                  
                  <Switch
                    checked={category.is_active}
                    onCheckedChange={(checked) => handleToggleActive(category.id, checked)}
                  />
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Subcategorías */}
              {subcategoriesByParent[category.id] && (
                <div className="mt-4 pl-8 space-y-2">
                  {subcategoriesByParent[category.id].map(subcat => (
                    <div key={subcat.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span style={{ color: subcat.color }}>●</span>
                        <span>{subcat.icon}</span>
                        <span className="text-sm">{subcat.name}</span>
                        {!subcat.is_active && (
                          <Badge variant="outline" className="text-xs">Inactiva</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {subcat.budget_limit && (
                          <span className="text-xs text-gray-500">
                            ${subcat.budget_limit.toLocaleString()}
                          </span>
                        )}
                        <Switch
                          checked={subcat.is_active}
                          onCheckedChange={(checked) => handleToggleActive(subcat.id, checked)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(subcat)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(subcat.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de crear/editar categoría */}
      {showModal && (
        <Dialog open={showModal} onOpenChange={() => setShowModal(false)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre y descripción */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Categoría *</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Alimentación, Transporte, etc."
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={cn(errors.name && 'border-red-500')}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe brevemente esta categoría..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Color e icono */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {DEFAULT_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          'w-8 h-8 rounded-full border-2 border-gray-200',
                          formData.color === color && 'border-gray-800 scale-110'
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => handleInputChange('color', color)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Icono</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {DEFAULT_ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        className={cn(
                          'w-8 h-8 rounded border border-gray-200 flex items-center justify-center text-lg hover:bg-gray-100',
                          formData.icon === icon && 'border-gray-800 bg-gray-100'
                        )}
                        onClick={() => handleInputChange('icon', icon)}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Categoría padre */}
              <div className="space-y-2">
                <Label>Categoría Padre (opcional)</Label>
                <Select 
                  value={formData.parent_id} 
                  onValueChange={(value) => handleInputChange('parent_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría padre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin categoría padre</SelectItem>
                    {parentCategories.map(category => (
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
              </div>

              {/* Presupuesto */}
              <div className="space-y-2">
                <Label htmlFor="budget">Presupuesto Mensual (opcional)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.budget_limit || ''}
                    onChange={(e) => handleInputChange('budget_limit', parseFloat(e.target.value) || 0)}
                    className={cn('pl-10', errors.budget_limit && 'border-red-500')}
                  />
                </div>
                {errors.budget_limit && <p className="text-sm text-red-500">{errors.budget_limit}</p>}
              </div>

              {/* Estado activo */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Categoría Activa</Label>
                  <p className="text-sm text-gray-600">
                    Las categorías inactivas no aparecerán en los formularios
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
              </div>

              {/* Vista previa */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Vista Previa</h4>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: formData.color }}
                  >
                    <span className="text-white text-sm font-bold">
                      {formData.icon || '●'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{formData.name || 'Nombre de la categoría'}</p>
                    {formData.description && (
                      <p className="text-sm text-gray-600">{formData.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : editingCategory ? 'Actualizar' : 'Crear'} Categoría
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 