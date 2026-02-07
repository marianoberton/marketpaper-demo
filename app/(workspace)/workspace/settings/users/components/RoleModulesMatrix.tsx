'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWorkspace } from '@/components/workspace-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Save, RotateCcw, Loader2 } from 'lucide-react'

interface Module {
  id: string
  name: string
  icon: string
  category: string
  is_core: boolean
}

const ROLES = [
  { key: 'company_owner', label: 'Propietario' },
  { key: 'company_admin', label: 'Administrador' },
  { key: 'manager', label: 'Manager' },
  { key: 'employee', label: 'Empleado' },
  { key: 'viewer', label: 'Viewer' },
]

export function RoleModulesMatrix() {
  const { companyId } = useWorkspace()
  const [modules, setModules] = useState<Module[]>([])
  const [roleModules, setRoleModules] = useState<Record<string, string[]>>({})
  const [originalRoleModules, setOriginalRoleModules] = useState<Record<string, string[]>>({})
  const [isCustomized, setIsCustomized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspace/settings/role-modules?company_id=${companyId}`)
      if (!res.ok) throw new Error('Error al cargar datos')
      const data = await res.json()

      setModules(data.companyModules || [])
      setIsCustomized(data.isCustomized)

      if (data.isCustomized) {
        setRoleModules(data.roleModules)
        setOriginalRoleModules(data.roleModules)
      } else {
        // Initialize with all modules enabled for all roles
        const initial: Record<string, string[]> = {}
        ROLES.forEach(r => {
          initial[r.key] = (data.companyModules || []).map((m: Module) => m.id)
        })
        setRoleModules(initial)
        setOriginalRoleModules(initial)
      }
    } catch (error) {
      toast.error('Error al cargar la configuracion de modulos')
    } finally {
      setIsLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    if (companyId) fetchData()
  }, [companyId, fetchData])

  const toggleModule = (role: string, moduleId: string) => {
    setRoleModules(prev => {
      const current = prev[role] || []
      const updated = current.includes(moduleId)
        ? current.filter(id => id !== moduleId)
        : [...current, moduleId]
      return { ...prev, [role]: updated }
    })
  }

  const hasChanges = JSON.stringify(roleModules) !== JSON.stringify(originalRoleModules)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/workspace/settings/role-modules?company_id=${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleModules }),
      })

      if (!res.ok) throw new Error('Error al guardar')

      setOriginalRoleModules({ ...roleModules })
      setIsCustomized(true)
      toast.success('Configuracion de modulos guardada')
    } catch {
      toast.error('Error al guardar la configuracion')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    setIsSaving(true)
    try {
      // Send empty roleModules to delete all custom config
      const res = await fetch(`/api/workspace/settings/role-modules?company_id=${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleModules: { company_owner: [], company_admin: [], manager: [], employee: [], viewer: [] } }),
      })

      if (!res.ok) throw new Error('Error al restablecer')

      // Re-initialize with all enabled
      const initial: Record<string, string[]> = {}
      ROLES.forEach(r => {
        initial[r.key] = modules.map(m => m.id)
      })
      setRoleModules(initial)
      setOriginalRoleModules(initial)
      setIsCustomized(false)
      toast.success('Configuracion restablecida a valores por defecto')
    } catch {
      toast.error('Error al restablecer')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando configuracion...
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group modules by category
  const modulesByCategory = modules.reduce((acc, mod) => {
    const cat = mod.category || 'Otros'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(mod)
    return acc
  }, {} as Record<string, Module[]>)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Modulos por Rol</CardTitle>
            <CardDescription>
              Configura que modulos puede ver cada rol en tu empresa
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isCustomized && (
              <Badge variant="outline" className="text-xs">Personalizado</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 pr-4 font-medium text-muted-foreground min-w-[180px]">
                  Modulo
                </th>
                {ROLES.map(role => (
                  <th key={role.key} className="text-center py-3 px-3 font-medium text-muted-foreground min-w-[100px]">
                    {role.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(modulesByCategory).map(([category, mods]) => (
                <tr key={`cat-${category}`}>
                  <td colSpan={ROLES.length + 1} className="pt-4 pb-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {category}
                    </span>
                    {mods.map(mod => (
                      <tr key={mod.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{mod.name}</span>
                            {mod.is_core && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Core</Badge>
                            )}
                          </div>
                        </td>
                        {ROLES.map(role => (
                          <td key={`${mod.id}-${role.key}`} className="text-center py-2.5 px-3">
                            <Switch
                              checked={(roleModules[role.key] || []).includes(mod.id)}
                              onCheckedChange={() => toggleModule(role.key, mod.id)}
                              className="mx-auto"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isSaving}
            className="text-muted-foreground"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Restablecer a defaults
          </Button>

          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar cambios
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
