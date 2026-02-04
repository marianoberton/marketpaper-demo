'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
// Tabs eliminado - ya no se usan pestañas para dashboard/workspace legacy

interface ClientTemplate {
  id: string
  name: string
  description?: string
  category: string
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
  category: 'Dashboard' | 'Workspace' | 'Analytics' | 'Tools' | 'Admin';
  route_path: string;
  icon: string;
}

type TemplateFormData = Omit<ClientTemplate, 'id' | 'created_at'>

// Las constantes DASHBOARD_MODULES y WORKSPACE_MODULES se han eliminado 
// porque ahora usamos solo módulos dinámicos desde la base de datos

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

  // handleModuleChange eliminado - ya no se usan módulos dashboard/workspace legacy

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
          <DialogHeader className="sticky top-0 bg-card z-10 pb-4">
            <DialogTitle>{isEdit ? 'Editar Plantilla' : 'Nueva Plantilla'}</DialogTitle>
            <DialogDescription>
              Configura los módulos que estarán disponibles para las empresas con esta plantilla
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

            {/* Configuración de módulos por categoría */}
            <Card>
              <CardHeader>
                <CardTitle>Módulos Asignados</CardTitle>
                <CardDescription>
                  Selecciona los módulos que estarán disponibles para las empresas con esta plantilla
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Módulos Dashboard */}
                <div>
                  <h3 className="text-lg font-medium mb-3 text-foreground">📊 Módulos Dashboard</h3>
                  <ModuleSelector
                    title="Dashboard"
                    modules={availableModules.filter(m => m.category === 'Dashboard')}
                    selected={formData.modules}
                    onChange={handleDynamicModuleChange}
                  />
                </div>

                {/* Módulos Workspace */}
                <div>
                  <h3 className="text-lg font-medium mb-3 text-foreground">🏢 Módulos Workspace</h3>
                  <ModuleSelector
                    title="Workspace"
                    modules={availableModules.filter(m => m.category === 'Workspace')}
                    selected={formData.modules}
                    onChange={handleDynamicModuleChange}
                  />
                </div>

                {/* Módulos Analytics */}
                {availableModules.filter(m => m.category === 'Analytics').length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-foreground">📈 Módulos Analytics</h3>
                    <ModuleSelector
                      title="Analytics"
                      modules={availableModules.filter(m => m.category === 'Analytics')}
                      selected={formData.modules}
                      onChange={handleDynamicModuleChange}
                    />
                  </div>
                )}

                {/* Resumen de selección */}
                <div className="pt-4 border-t border-border">
                  <h4 className="font-medium text-muted-foreground mb-2">Resumen de Selección:</h4>
                  <div className="flex gap-4 text-sm flex-wrap">
                    <span className="text-foreground">
                      📊 Dashboard: {availableModules.filter(m => m.category === 'Dashboard' && formData.modules.includes(m.id)).length}
                    </span>
                    <span className="text-foreground">
                      🏢 Workspace: {availableModules.filter(m => m.category === 'Workspace' && formData.modules.includes(m.id)).length}
                    </span>
                    <span className="text-foreground">
                      📈 Analytics: {availableModules.filter(m => m.category === 'Analytics' && formData.modules.includes(m.id)).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange('is_active', checked as boolean)}
              />
              <Label htmlFor="is_active">Plantilla activa</Label>
            </div>
            <DialogFooter className="mt-6 sticky bottom-0 bg-card pt-4">
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
      const response = await fetch(`/api/admin/templates?id=${templateId}`, {
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
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plantillas de Cliente</h1>
          <p className="text-muted-foreground">Gestiona plantillas predefinidas para nuevos clientes</p>
          <div className="h-1 w-24 bg-primary rounded-full mt-2" />
        </div>
        <Button onClick={() => handleOpenDialog()} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Stats Card */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Plantillas</p>
              <p className="text-2xl font-bold">{templates.length}</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="h-8 w-8 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar plantillas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="space-y-4">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No hay plantillas configuradas</h3>
            <p className="text-muted-foreground mb-4">Crea la primera plantilla para empezar a gestionar configuraciones de cliente</p>
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
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(template.id)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Máx. usuarios:</span><span className="font-medium">{template.max_users}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Máx. contactos:</span><span className="font-medium">{template.max_contacts.toLocaleString()}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Llamadas API:</span><span className="font-medium">{template.max_api_calls.toLocaleString()}</span></div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {/* Dashboard Modules */}
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1 flex items-center gap-1">
                        📊 Dashboard
                        ({availableModules.filter(m => m.category === 'Dashboard' && template.modules?.includes(m.id)).length})
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const dashboardModules = availableModules.filter(m => m.category === 'Dashboard' && template.modules?.includes(m.id));
                          return dashboardModules.length > 0 ? (
                            <>
                              {dashboardModules.slice(0, 2).map((module) => (
                                <Badge key={module.id} variant="outline" className="text-xs">
                                  {module.name}
                                </Badge>
                              ))}
                              {dashboardModules.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{dashboardModules.length - 2} más
                                </Badge>
                              )}
                            </>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Sin módulos dashboard</Badge>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Workspace Modules */}
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1 flex items-center gap-1">
                        🏢 Workspace
                        ({availableModules.filter(m => m.category === 'Workspace' && template.modules?.includes(m.id)).length})
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const workspaceModules = availableModules.filter(m => m.category === 'Workspace' && template.modules?.includes(m.id));
                          return workspaceModules.length > 0 ? (
                            <>
                              {workspaceModules.slice(0, 2).map((module) => (
                                <Badge key={module.id} variant="secondary" className="text-xs">
                                  {module.name}
                                </Badge>
                              ))}
                              {workspaceModules.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{workspaceModules.length - 2} más
                                </Badge>
                              )}
                            </>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Sin módulos workspace</Badge>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Analytics Modules */}
                    {(() => {
                      const analyticsModules = availableModules.filter(m => m.category === 'Analytics' && template.modules?.includes(m.id));
                      if (analyticsModules.length === 0) return null;
                      return (
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-1 flex items-center gap-1">
                            📈 Analytics ({analyticsModules.length})
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {analyticsModules.slice(0, 2).map((module) => (
                              <Badge key={module.id} variant="secondary" className="text-xs">
                                {module.name}
                              </Badge>
                            ))}
                            {analyticsModules.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{analyticsModules.length - 2} más
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <Badge variant={template.is_active ? "default" : "secondary"}>{template.is_active ? 'Activa' : 'Inactiva'}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(template.created_at).toLocaleDateString('es-ES')}</span>
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