'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Webhook,
  Plus,
  Trash2,
  Loader2,
  Globe,
  Shield,
} from 'lucide-react'
import { nexusApi } from '@/lib/nexus/api'
import { toast } from 'sonner'

interface ProjectWebhook {
  id: string
  name: string
  description?: string
  agentId: string
  triggerPrompt: string
  secret?: string
  allowedIps?: string[]
  status: 'active' | 'paused'
  createdAt: string
}

export default function WebhooksPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const [webhooks, setWebhooks] = useState<ProjectWebhook[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    description: '',
    agentId: '',
    triggerPrompt: '',
    allowedIps: '',
  })

  useEffect(() => {
    nexusApi
      .get<{ items?: ProjectWebhook[]; data?: ProjectWebhook[] }>(`/projects/${projectId}/webhooks`)
      .then((res) => setWebhooks(res.items || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId])

  async function handleCreate() {
    setCreating(true)
    try {
      const result = await nexusApi.post<ProjectWebhook>(`/projects/${projectId}/webhooks`, {
        name: newWebhook.name,
        description: newWebhook.description || undefined,
        agentId: newWebhook.agentId,
        triggerPrompt: newWebhook.triggerPrompt,
        allowedIps: newWebhook.allowedIps
          ? newWebhook.allowedIps.split(',').map((ip) => ip.trim()).filter(Boolean)
          : undefined,
      })
      setWebhooks((prev) => [...prev, result])
      toast.success('Webhook creado')
      setCreateOpen(false)
      setNewWebhook({ name: '', description: '', agentId: '', triggerPrompt: '', allowedIps: '' })
    } catch {
      toast.error('Error al crear webhook')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await nexusApi.delete(`/projects/${projectId}/webhooks/${deleteId}`)
      setWebhooks((prev) => prev.filter((w) => w.id !== deleteId))
      toast.success('Webhook eliminado')
      setDeleteId(null)
    } catch {
      toast.error('Error al eliminar')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/admin/nexus/projects/${projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
            <p className="text-muted-foreground">
              Endpoints para integración con servicios externos
            </p>
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nuevo Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  placeholder="telegram_webhook"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={newWebhook.description}
                  onChange={(e) => setNewWebhook({ ...newWebhook, description: e.target.value })}
                  placeholder="Webhook para mensajes de Telegram"
                />
              </div>
              <div className="space-y-2">
                <Label>Agent ID</Label>
                <Input
                  value={newWebhook.agentId}
                  onChange={(e) => setNewWebhook({ ...newWebhook, agentId: e.target.value })}
                  placeholder="ID del agente que procesará los mensajes"
                />
              </div>
              <div className="space-y-2">
                <Label>Trigger Prompt (Mustache)</Label>
                <Textarea
                  value={newWebhook.triggerPrompt}
                  onChange={(e) => setNewWebhook({ ...newWebhook, triggerPrompt: e.target.value })}
                  rows={3}
                  placeholder={'Nuevo mensaje de {{channel}}: {{message}}'}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>IPs Permitidas</Label>
                <Input
                  value={newWebhook.allowedIps}
                  onChange={(e) => setNewWebhook({ ...newWebhook, allowedIps: e.target.value })}
                  placeholder="149.154.160.0/20, 91.108.4.0/22"
                />
                <p className="text-xs text-muted-foreground">Separadas por coma (dejar vacío para permitir todas)</p>
              </div>
              <Button onClick={handleCreate} disabled={creating || !newWebhook.name || !newWebhook.agentId || !newWebhook.triggerPrompt}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Webhook
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Webhooks</p>
              <p className="text-2xl font-bold">{webhooks.length}</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10">
              <Webhook className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Webhook className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No hay webhooks configurados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{webhook.name}</CardTitle>
                      {webhook.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {webhook.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={webhook.status === 'active' ? 'default' : 'secondary'}>
                      {webhook.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Agent: {webhook.agentId.slice(0, 12)}...</span>
                    {webhook.allowedIps && webhook.allowedIps.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {webhook.allowedIps.length} IPs
                      </span>
                    )}
                  </div>
                  <pre className="text-xs font-mono bg-muted rounded p-2 overflow-x-auto">
                    {webhook.triggerPrompt}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los servicios externos dejarán de poder enviar datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
