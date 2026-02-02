'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, FileStack } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Module {
  id: string
  name: string
  route_path: string
  icon: string
  category: string
  description?: string
  display_order: number
  is_core: boolean
  allowed_roles?: string[] | null
  requires_integration?: string | null
}

interface ClientTemplate {
  id: string
  name: string
  description?: string
  category: string
  max_users: number
  max_contacts: number
  max_api_calls: number
  monthly_price?: number
}

interface TemplateManagementTabProps {
  companyId: string
  initialTemplateId?: string | null
}

export function TemplateManagementTab({ companyId, initialTemplateId }: TemplateManagementTabProps) {
  const router = useRouter()
  const [templates, setTemplates] = useState<ClientTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(initialTemplateId || null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<ClientTemplate | null>(null)

  // Cargar plantillas disponibles y módulos actuales
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        // Fetch templates
        const templatesRes = await fetch('/api/admin/templates')
        if (!templatesRes.ok) throw new Error('Error al cargar plantillas')
        const { templates: fetchedTemplates } = await templatesRes.json()
        setTemplates(fetchedTemplates)

        // Fetch company data with modules
        const companyRes = await fetch(`/api/admin/companies?id=${companyId}`)
        if (!companyRes.ok) throw new Error('Error al cargar empresa')
        const companyData = await companyRes.json()

        setModules(companyData.modules || [])
        setSelectedTemplateId(companyData.template_id || null)
        setCurrentTemplate(companyData.template || null)
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [companyId])

  // Actualizar currentTemplate cuando cambia selectedTemplateId
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId)
      if (template) {
        setCurrentTemplate(template)
      }
    } else {
      setCurrentTemplate(null)
    }
  }, [selectedTemplateId, templates])

  // Guardar cambios
  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/companies?id=${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: selectedTemplateId })
      })

      if (!res.ok) throw new Error('Error al guardar')

      toast.success('Plantilla actualizada correctamente')

      // Recargar módulos
      const companyRes = await fetch(`/api/admin/companies?id=${companyId}`)
      if (companyRes.ok) {
        const companyData = await companyRes.json()
        setModules(companyData.modules || [])
        setCurrentTemplate(companyData.template || null)
      }

      // Forzar recarga de la página para actualizar el workspace si está abierto
      router.refresh()
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Error al actualizar plantilla')
    } finally {
      setSaving(false)
    }
  }

  // Agrupar módulos por categoría
  const modulesByCategory = modules.reduce<Record<string, Module[]>>((acc, mod) => {
    const cat = mod.category || 'Workspace'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(mod)
    return acc
  }, {})

  // Ordenar categorías (Dashboard, Analytics, Workspace, Tools, Admin)
  const categoryOrder = ['Dashboard', 'Analytics', 'Workspace', 'Tools', 'Admin']
  const sortedCategories = Object.keys(modulesByCategory).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a)
    const indexB = categoryOrder.indexOf(b)
    if (indexA === -1 && indexB === -1) return a.localeCompare(b)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const hasChanges = selectedTemplateId !== initialTemplateId

  return (
    <div className="space-y-6">
      {/* Card 1: Plantilla Actual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileStack className="h-5 w-5" />
            Plantilla Asignada
          </CardTitle>
          <CardDescription>
            Selecciona la plantilla que determina los módulos y límites de esta empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dropdown de plantillas */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Plantilla</label>
            <Select
              value={selectedTemplateId || undefined}
              onValueChange={setSelectedTemplateId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar plantilla..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} <span className="text-muted-foreground">({t.category})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descripción */}
          {currentTemplate?.description && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">
                {currentTemplate.description}
              </p>
            </div>
          )}

          {/* Límites */}
          {currentTemplate && (
            <div>
              <h4 className="text-sm font-medium mb-3">Límites de la Plantilla</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground">Usuarios máx.</p>
                    <p className="text-2xl font-bold mt-1">{currentTemplate.max_users}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground">Contactos máx.</p>
                    <p className="text-2xl font-bold mt-1">
                      {currentTemplate.max_contacts.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground">API Calls máx.</p>
                    <p className="text-2xl font-bold mt-1">
                      {currentTemplate.max_api_calls.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Botón guardar */}
          <div className="flex items-center gap-4">
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
            {hasChanges && (
              <p className="text-sm text-muted-foreground">
                Tienes cambios sin guardar
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Módulos Activos */}
      <Card>
        <CardHeader>
          <CardTitle>Módulos Activos</CardTitle>
          <CardDescription>
            {modules.length > 0
              ? `${modules.length} ${modules.length === 1 ? 'módulo disponible' : 'módulos disponibles'} según la plantilla asignada`
              : 'No hay módulos asignados a esta plantilla'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileStack className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Esta plantilla no tiene módulos asignados</p>
            </div>
          ) : (
            <div className="space-y-8">
              {sortedCategories.map(category => {
                const categoryModules = modulesByCategory[category]
                return (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mb-4">
                      {category} <span className="text-muted-foreground font-normal">({categoryModules.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryModules.map(mod => (
                        <Card key={mod.id} className="hover:border-primary/50 transition-colors">
                          <CardContent className="pt-4">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-medium">{mod.name}</span>
                                <div className="flex flex-wrap gap-1 justify-end">
                                  {mod.is_core && (
                                    <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs">
                                      Core
                                    </Badge>
                                  )}
                                  {!mod.is_core && (
                                    <Badge variant="secondary" className="text-xs">
                                      Opcional
                                    </Badge>
                                  )}
                                  {mod.requires_integration && (
                                    <Badge variant="outline" className="border-orange-500 text-orange-600 text-xs">
                                      {mod.requires_integration}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground font-mono">
                                {mod.route_path}
                              </p>
                              {mod.description && (
                                <p className="text-xs text-muted-foreground">
                                  {mod.description}
                                </p>
                              )}
                              {mod.allowed_roles && mod.allowed_roles.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="text-xs text-muted-foreground">Roles:</span>
                                  {mod.allowed_roles.map(role => (
                                    <Badge key={role} variant="outline" className="text-xs">
                                      {role}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
