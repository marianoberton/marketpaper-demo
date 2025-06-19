'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Package, Edit, Copy, Trash2, MoreVertical } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ClientTemplate {
  id: string
  name: string
  description?: string
  category: string
  monthly_price: number
  setup_fee: number
  is_active: boolean
  created_at: string
  dashboard_modules: string[]
  workspace_modules: string[]
  max_users: number
  max_contacts: number
  max_api_calls: number
  modules: string[] // IDs of dynamic modules
}

interface Module {
  id: string;
  name: string;
  description?: string;
  category: 'Dashboard' | 'Workspace';
  route_path: string;
  icon: string;
}

type TemplateFormData = Omit<ClientTemplate, 'id' | 'created_at'>

// Definir módulos disponibles
const DASHBOARD_MODULES = [
  { id: 'overview', name: 'Vista General', description: 'Resumen general de métricas' },
  { id: 'analytics', name: 'Analytics', description: 'Análisis detallado de datos' },
  { id: 'sales', name: 'Ventas', description: 'Métricas de ventas y conversión' },
  { id: 'marketing', name: 'Marketing', description: 'Campañas y rendimiento de marketing' },
  { id: 'crm', name: 'CRM Dashboard', description: 'Resumen de CRM y contactos' },
  { id: 'financial', name: 'Financiero', description: 'Métricas financieras y rentabilidad' },
  { id: 'technical', name: 'Técnico', description: 'Métricas técnicas y rendimiento' },
  { id: 'team', name: 'Equipo', description: 'Rendimiento del equipo' }
]

const WORKSPACE_MODULES = [
  { id: 'crm', name: 'CRM', description: 'Gestión completa de clientes' },
  { id: 'projects', name: 'Proyectos', description: 'Gestión de proyectos' },
  { id: 'calendar', name: 'Calendario', description: 'Calendario y citas' },
  { id: 'documents', name: 'Documentos', description: 'Gestión de documentos' },
  { id: 'team', name: 'Equipo', description: 'Gestión de equipo' },
  { id: 'analytics', name: 'Analytics', description: 'Análisis de workspace' },
  { id: 'bots', name: 'Bots', description: 'Automatización y bots' },
  { id: 'knowledge', name: 'Base de Conocimiento', description: 'Gestión de conocimiento' },
  { id: 'expenses', name: 'Gastos', description: 'Gestión de gastos' },
  { id: 'settings', name: 'Configuración', description: 'Configuración del workspace' }
]

interface TemplateDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: TemplateFormData) => void
  template?: ClientTemplate | null
  isSaving: boolean
  availableModules: Module[]
}

const MemoizedTemplateDialog = React.memo(({ isOpen, onClose, onSave, template, isSaving, availableModules }: TemplateDialogProps) => {
  const isEdit = !!template

  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    category: 'standard',
    monthly_price: 0,
    setup_fee: 0,
    max_users: 5,
    max_contacts: 1000,
    max_api_calls: 10000,
    dashboard_modules: [],
    workspace_modules: [],
    modules: [],
    is_active: true
  })

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        category: template.category,
        monthly_price: template.monthly_price,
        setup_fee: template.setup_fee,
        max_users: template.max_users,
        max_contacts: template.max_contacts,
        max_api_calls: template.max_api_calls,
        dashboard_modules: template.dashboard_modules,
        workspace_modules: template.workspace_modules,
        modules: template.modules || [],
        is_active: template.is_active
      })
    } else {
      // Reset for new template
      setFormData({
        name: '',
        description: '',
        category: 'standard',
        monthly_price: 0,
        setup_fee: 0,
        max_users: 5,
        max_contacts: 1000,
        max_api_calls: 10000,
        dashboard_modules: [],
        workspace_modules: [],
        modules: [],
        is_active: true
      })
    }
  }, [template])

  const handleChange = (field: keyof TemplateFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleModuleChange = (type: 'dashboard' | 'workspace', moduleId: string, checked: boolean) => {
    const key = `${type}_modules` as const
    setFormData(prev => ({
      ...prev,
      [key]: checked
        ? [...prev[key], moduleId]
        : prev[key].filter(id => id !== moduleId)
    }))
  }

  const handleDynamicModuleChange = (moduleId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      modules: checked
        ? [...prev.modules, moduleId]
        : prev.modules.filter(id => id !== moduleId)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <div className="max-h-[80vh] overflow-y-auto pr-2">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-4">
            <DialogTitle>{isEdit ? 'Editar Plantilla' : 'Nueva Plantilla'}</DialogTitle>
            <DialogDescription>
              Configura los módulos del dashboard y workspace que tendrá esta plantilla
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre de la plantilla</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder="ej. Starter, Professional, Enterprise"
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select value={formData.category} onValueChange={value => handleChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="Describe qué incluye esta plantilla..."
                autoComplete="off"
              />
            </div>

            {/* Precios y límites */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthly_price">Precio mensual (€)</Label>
                <Input
                  id="monthly_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthly_price}
                  onChange={e => handleChange('monthly_price', parseFloat(e.target.value) || 0)}
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="setup_fee">Tarifa de configuración (€)</Label>
                <Input
                  id="setup_fee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.setup_fee}
                  onChange={e => handleChange('setup_fee', parseFloat(e.target.value) || 0)}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="max_users">Máximo usuarios</Label>
                <Input
                  id="max_users"
                  type="number"
                  min="1"
                  value={formData.max_users}
                  onChange={e => handleChange('max_users', parseInt(e.target.value) || 0)}
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="max_contacts">Máximo contactos</Label>
                <Input
                  id="max_contacts"
                  type="number"
                  min="1"
                  value={formData.max_contacts}
                  onChange={e => handleChange('max_contacts', parseInt(e.target.value) || 0)}
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="max_api_calls">Llamadas API/mes</Label>
                <Input
                  id="max_api_calls"
                  type="number"
                  min="1"
                  value={formData.max_api_calls}
                  onChange={e => handleChange('max_api_calls', parseInt(e.target.value) || 0)}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Configuración de módulos */}
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="workspace">Workspace</TabsTrigger>
                <TabsTrigger value="dynamic">Módulos Dinámicos</TabsTrigger>
              </TabsList>
              <TabsContent value="dashboard">
                <ModuleSelector
                  title="Módulos del Dashboard"
                  modules={DASHBOARD_MODULES}
                  selected={formData.dashboard_modules}
                  onChange={(id, checked) => handleModuleChange('dashboard', id, checked)}
                />
              </TabsContent>
              <TabsContent value="workspace">
                <ModuleSelector
                  title="Módulos del Workspace"
                  modules={WORKSPACE_MODULES}
                  selected={formData.workspace_modules}
                  onChange={(id, checked) => handleModuleChange('workspace', id, checked)}
                />
              </TabsContent>
              <TabsContent value="dynamic">
                <ModuleSelector
                  title="Módulos Dinámicos"
                  modules={availableModules}
                  selected={formData.modules}
                  onChange={handleDynamicModuleChange}
                />
              </TabsContent>
            </Tabs>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange('is_active', checked as boolean)}
              />
              <Label htmlFor="is_active">Plantilla activa</Label>
            </div>
            <DialogFooter className="mt-6 sticky bottom-0 bg-white pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear')} Plantilla
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
})
MemoizedTemplateDialog.displayName = 'TemplateDialog'

interface ModuleSelectorProps {
  title: string
  modules: { id: string, name: string, description?: string }[]
  selected: string[]
  onChange: (id: string, checked: boolean) => void
}

const ModuleSelector = ({ title, modules, selected, onChange }: ModuleSelectorProps) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {modules.map(module => (
        <div key={module.id} className="flex items-center space-x-3 p-3 rounded-md border">
          <Checkbox
            id={`${title}-${module.id}`}
            checked={selected.includes(module.id)}
            onCheckedChange={checked => onChange(module.id, !!checked)}
          />
          <Label htmlFor={`${title}-${module.id}`} className="flex flex-col">
            <span>{module.name}</span>
            {module.description && <span className="text-xs text-muted-foreground">{module.description}</span>}
          </Label>
        </div>
      ))}
    </CardContent>
  </Card>
)

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ClientTemplate[]>([])
  const [availableModules, setAvailableModules] = useState<Module[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ClientTemplate | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const loadTemplates = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/templates')
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }
      const data = await response.json()
      // API returns { templates: [], availableModules: [] }
      setTemplates(data.templates || [])
      setAvailableModules(data.availableModules || [])
    } catch (error) {
      console.error(error)
      // toast.error('Error al cargar las plantillas')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const handleSaveTemplate = async (formData: TemplateFormData) => {
    setIsSaving(true)
    const method = selectedTemplate ? 'PUT' : 'POST'
    const url = selectedTemplate
      ? `/api/admin/templates?id=${selectedTemplate.id}`
      : '/api/admin/templates'

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(selectedTemplate ? 'Failed to update template' : 'Failed to create template')
      }

      await loadTemplates()
      handleCloseDialog()
      // toast.success(`Plantilla ${selectedTemplate ? 'actualizada' : 'creada'} correctamente`)
    } catch (error) {
      console.error(error)
      // toast.error(`Error al ${selectedTemplate ? 'actualizar' : 'crear'} la plantilla`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = useCallback(async (templateId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      return;
    }

    setError(null);
    try {
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar la plantilla.');
      }
      
      await loadTemplates(); // Recargar
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Un error inesperado ocurrió.');
    }
  }, [loadTemplates]);

  const handleDuplicateTemplate = useCallback(async (template: ClientTemplate) => {
    if (!window.confirm(`¿Quieres duplicar la plantilla "${template.name}"?`)) {
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, ...templateData } = template;
    
    try {
      await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...templateData,
          name: `${template.name} (Copia)`,
          is_active: false, // Duplicates start as inactive
        }),
      });
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al duplicar la plantilla.');
    } finally {
      setIsSaving(false);
    }
  }, [loadTemplates]);

  const handleOpenDialog = (template: ClientTemplate | null = null) => {
    setSelectedTemplate(template)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedTemplate(null)
  }

  const filteredTemplates = templates.filter(template => {
    const searchLower = searchTerm.toLowerCase()
    return template.name.toLowerCase().includes(searchLower) ||
           template.description?.toLowerCase().includes(searchLower)
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantillas de Cliente</h1>
          <p className="text-gray-600">Gestiona plantillas predefinidas para nuevos clientes</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Plantillas</p>
              <p className="text-2xl font-bold">{templates.length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar plantillas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <div className="space-y-4">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay plantillas configuradas</h3>
            <p className="text-gray-600 mb-4">Crea la primera plantilla para empezar a gestionar configuraciones de cliente</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Plantilla
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg capitalize">{template.name}</CardTitle>
                      <Badge variant={template.category === 'enterprise' ? 'default' : 'secondary'}>{template.category}</Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenDialog(template)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}><Copy className="mr-2 h-4 w-4" />Duplicar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(template.id)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Precio mensual:</span><span className="font-medium">{formatCurrency(template.monthly_price)}</span></div>
                    {template.setup_fee > 0 && (<div className="flex justify-between text-sm"><span className="text-gray-600">Configuración:</span><span className="font-medium">{formatCurrency(template.setup_fee)}</span></div>)}
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Máx. usuarios:</span><span className="font-medium">{template.max_users}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Máx. contactos:</span><span className="font-medium">{template.max_contacts.toLocaleString()}</span></div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Dashboard ({template.dashboard_modules.length})</h4>
                    <div className="flex flex-wrap gap-1">
                      {template.dashboard_modules.slice(0, 3).map((moduleId) => (<Badge key={moduleId} variant="outline" className="text-xs">{DASHBOARD_MODULES.find(m => m.id === moduleId)?.name || moduleId}</Badge>))}
                      {template.dashboard_modules.length > 3 && (<Badge variant="outline" className="text-xs">+{template.dashboard_modules.length - 3} más</Badge>)}
                    </div>
                  </div>
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Workspace ({template.workspace_modules.length})</h4>
                    <div className="flex flex-wrap gap-1">
                      {template.workspace_modules.slice(0, 3).map((moduleId) => (<Badge key={moduleId} variant="secondary" className="text-xs">{WORKSPACE_MODULES.find(m => m.id === moduleId)?.name || moduleId}</Badge>))}
                      {template.workspace_modules.length > 3 && (<Badge variant="secondary" className="text-xs">+{template.workspace_modules.length - 3} más</Badge>)}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <Badge variant={template.is_active ? "default" : "secondary"}>{template.is_active ? 'Activa' : 'Inactiva'}</Badge>
                    <span className="text-xs text-gray-500">{new Date(template.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <MemoizedTemplateDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveTemplate}
        template={selectedTemplate}
        isSaving={isSaving}
        availableModules={availableModules}
      />
    </div>
  )
} 