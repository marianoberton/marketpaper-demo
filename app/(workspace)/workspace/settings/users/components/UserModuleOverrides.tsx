'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from '@/components/workspace-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2, RotateCcw, Save, Minus, Plus, Equal } from 'lucide-react'

interface UserModuleOverridesProps {
  user: {
    id: string
    full_name: string | null
    email: string
    role: string
  }
  isOpen: boolean
  onClose: () => void
}

interface Module {
  id: string
  name: string
  icon: string
  category: string
  is_core: boolean
}

type OverrideState = 'inherited' | 'granted' | 'revoked'

export function UserModuleOverrides({ user, isOpen, onClose }: UserModuleOverridesProps) {
  const { companyId } = useWorkspace()
  const [modules, setModules] = useState<Module[]>([])
  const [roleModuleIds, setRoleModuleIds] = useState<Set<string>>(new Set())
  const [overrides, setOverrides] = useState<Record<string, 'grant' | 'revoke'>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      loadData()
    }
  }, [isOpen, user])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Fetch role-modules matrix and user overrides in parallel
      const [roleRes, userRes] = await Promise.all([
        fetch(`/api/workspace/settings/role-modules?company_id=${companyId}`),
        fetch(`/api/workspace/settings/user-modules?user_id=${user.id}&company_id=${companyId}`),
      ])

      if (!roleRes.ok || !userRes.ok) throw new Error('Error al cargar datos')

      const roleData = await roleRes.json()
      const userData = await userRes.json()

      setModules(roleData.companyModules || [])

      // Determine which modules the user's role would give them
      const roleIds = new Set<string>(
        roleData.isCustomized
          ? (roleData.roleModules[user.role] || [])
          : (roleData.companyModules || []).map((m: Module) => m.id)
      )
      setRoleModuleIds(roleIds)

      // Load existing overrides
      const overrideMap: Record<string, 'grant' | 'revoke'> = {}
      for (const o of userData.overrides || []) {
        overrideMap[o.module_id] = o.override_type
      }
      setOverrides(overrideMap)
    } catch {
      toast.error('Error al cargar la configuracion del usuario')
    } finally {
      setIsLoading(false)
    }
  }

  const getModuleState = (moduleId: string): OverrideState => {
    if (overrides[moduleId] === 'grant') return 'granted'
    if (overrides[moduleId] === 'revoke') return 'revoked'
    return 'inherited'
  }

  const isModuleEnabled = (moduleId: string): boolean => {
    const state = getModuleState(moduleId)
    if (state === 'granted') return true
    if (state === 'revoked') return false
    return roleModuleIds.has(moduleId)
  }

  const toggleModule = (moduleId: string) => {
    const currentEnabled = isModuleEnabled(moduleId)
    const fromRole = roleModuleIds.has(moduleId)

    setOverrides(prev => {
      const next = { ...prev }

      if (currentEnabled) {
        // Disabling
        if (fromRole) {
          next[moduleId] = 'revoke'
        } else {
          delete next[moduleId]
        }
      } else {
        // Enabling
        if (!fromRole) {
          next[moduleId] = 'grant'
        } else {
          delete next[moduleId]
        }
      }

      return next
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const overridesList = Object.entries(overrides).map(([module_id, override_type]) => ({
        module_id,
        override_type,
      }))

      const res = await fetch(`/api/workspace/settings/user-modules?company_id=${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, overrides: overridesList }),
      })

      if (!res.ok) throw new Error('Error al guardar')

      toast.success('Modulos del usuario actualizados')
      onClose()
    } catch {
      toast.error('Error al guardar los cambios')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetToRole = () => {
    setOverrides({})
  }

  const stateConfig: Record<OverrideState, { label: string; color: string; icon: React.ElementType }> = {
    inherited: { label: 'Del rol', color: 'bg-muted text-muted-foreground', icon: Equal },
    granted: { label: 'Concedido', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: Plus },
    revoked: { label: 'Revocado', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: Minus },
  }

  const hasOverrides = Object.keys(overrides).length > 0

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Modulos de {user.full_name || user.email}</DialogTitle>
          <DialogDescription>
            Configura que modulos puede ver este usuario. Los cambios sobreescriben la configuracion del rol.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando...
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 -mx-6 px-6 space-y-1">
            {modules.map(mod => {
              const state = getModuleState(mod.id)
              const enabled = isModuleEnabled(mod.id)
              const config = stateConfig[state]
              const StateIcon = config.icon

              return (
                <div
                  key={mod.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-sm text-foreground truncate">{mod.name}</span>
                      <span className="text-xs text-muted-foreground">{mod.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {state !== 'inherited' && (
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.color}`}>
                        <StateIcon className="h-3 w-3 mr-0.5" />
                        {config.label}
                      </Badge>
                    )}
                    <Switch
                      checked={enabled}
                      onCheckedChange={() => toggleModule(mod.id)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <DialogFooter className="flex items-center justify-between gap-2 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleResetToRole}
            disabled={!hasOverrides || isSaving}
            className="text-muted-foreground"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Restablecer al rol
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
