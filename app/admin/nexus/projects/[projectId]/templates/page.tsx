'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
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
  FileCode,
  Plus,
  Trash2,
  Loader2,
  Hash,
} from 'lucide-react'
import { useTemplates, useCreateTemplate, useDeleteTemplate } from '@/lib/nexus/hooks/use-templates'
import type { Template } from '@/lib/nexus/types'
import { toast } from 'sonner'

function detectVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))]
}

export default function TemplatesPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const { data: templates, isLoading } = useTemplates(projectId)
  const createTemplate = useCreateTemplate(projectId)
  const deleteTemplate = useDeleteTemplate(projectId)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '' })

  const detectedVars = detectVariables(newTemplate.content)

  async function handleCreate() {
    try {
      await createTemplate.mutateAsync({
        name: newTemplate.name,
        content: newTemplate.content,
        variables: detectedVars,
      })
      toast.success('Template creado')
      setCreateOpen(false)
      setNewTemplate({ name: '', content: '' })
    } catch {
      toast.error('Error al crear template')
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteTemplate.mutateAsync(deleteId)
      toast.success('Template eliminado')
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
            <h1 className="text-3xl font-bold tracking-tight">Plantillas</h1>
            <p className="text-muted-foreground">
              Plantillas reutilizables con variables Mustache
            </p>
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Plantilla
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nueva Plantilla</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="welcome_message"
                />
              </div>
              <div className="space-y-2">
                <Label>Contenido</Label>
                <Textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  rows={6}
                  placeholder={'Hola {{nombre}}, bienvenido a {{empresa}}.\n\nTu pedido #{{pedido_id}} está en proceso.'}
                  className="font-mono text-sm"
                />
              </div>
              {detectedVars.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Variables detectadas</Label>
                  <div className="flex flex-wrap gap-1">
                    {detectedVars.map((v) => (
                      <Badge key={v} variant="secondary" className="text-xs font-mono">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <Button onClick={handleCreate} disabled={createTemplate.isPending || !newTemplate.name || !newTemplate.content}>
                {createTemplate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Plantilla
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
              <p className="text-sm text-muted-foreground">Total Plantillas</p>
              <p className="text-2xl font-bold">{templates?.length || 0}</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10">
              <FileCode className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : !templates || templates.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileCode className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No hay plantillas</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template: Template) => (
            <Card key={template.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-mono">{template.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Hash className="mr-1 h-3 w-3" />
                      {template.usageCount || 0} usos
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(template.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs font-mono bg-muted rounded p-3 overflow-x-auto line-clamp-4">
                  {template.content}
                </pre>
                {template.variables && template.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.variables.map((v) => (
                      <Badge key={v} variant="secondary" className="text-xs font-mono">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
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
