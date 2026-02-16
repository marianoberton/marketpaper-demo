'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useAgent, useUpdateAgent } from '@/lib/nexus/hooks/use-agents'
import { toast } from 'sonner'

export default function EditAgentPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const agentId = params.agentId as string

  const { data: agent, isLoading } = useAgent(projectId, agentId)
  const updateAgent = useUpdateAgent(projectId, agentId)

  const [form, setForm] = useState({
    name: '',
    description: '',
    identity: '',
    instructions: '',
    safety: '',
    toolAllowlist: '',
    maxTurns: '',
    budgetPerDayUsd: '',
  })

  useEffect(() => {
    if (agent) {
      setForm({
        name: agent.name || '',
        description: agent.description || '',
        identity: agent.config?.promptSummary?.identity || '',
        instructions: agent.config?.promptSummary?.instructions || '',
        safety: agent.config?.promptSummary?.safety || '',
        toolAllowlist: agent.config?.toolAllowlist?.join(', ') || '',
        maxTurns: agent.config?.maxTurns?.toString() || '',
        budgetPerDayUsd: agent.config?.budgetPerDayUsd?.toString() || '',
      })
    }
  }, [agent])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      await updateAgent.mutateAsync({
        name: form.name,
        description: form.description || undefined,
        promptConfig: {
          identity: form.identity,
          instructions: form.instructions,
          safety: form.safety,
        },
        toolAllowlist: form.toolAllowlist
          ? form.toolAllowlist.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        limits: {
          maxTurns: form.maxTurns ? parseInt(form.maxTurns) : undefined,
          budgetPerDayUsd: form.budgetPerDayUsd ? parseFloat(form.budgetPerDayUsd) : undefined,
        },
      })
      toast.success('Agente actualizado exitosamente')
      router.push(`/admin/nexus/projects/${projectId}/agents`)
    } catch {
      toast.error('Error al actualizar agente')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/nexus/projects/${projectId}/agents`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Agente</h1>
          <p className="text-muted-foreground">{agent?.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Nombre y descripción del agente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Prompts */}
        <Card>
          <CardHeader>
            <CardTitle>Prompt Config</CardTitle>
            <CardDescription>Identidad, instrucciones y reglas de seguridad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identity">Identidad</Label>
              <Textarea
                id="identity"
                value={form.identity}
                onChange={(e) => setForm({ ...form, identity: e.target.value })}
                rows={3}
                placeholder="Sos un asistente virtual de ventas..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Instrucciones</Label>
              <Textarea
                id="instructions"
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                rows={3}
                placeholder="Ayudas a los clientes a encontrar productos..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="safety">Seguridad</Label>
              <Textarea
                id="safety"
                value={form.safety}
                onChange={(e) => setForm({ ...form, safety: e.target.value })}
                rows={3}
                placeholder="Nunca reveles información confidencial..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Tools & Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Tools y Límites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tools">Tools Permitidos</Label>
              <Input
                id="tools"
                value={form.toolAllowlist}
                onChange={(e) => setForm({ ...form, toolAllowlist: e.target.value })}
                placeholder="calculator, datetime, web_search"
              />
              <p className="text-xs text-muted-foreground">Separados por coma</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxTurns">Max Turns</Label>
                <Input
                  id="maxTurns"
                  type="number"
                  value={form.maxTurns}
                  onChange={(e) => setForm({ ...form, maxTurns: e.target.value })}
                  placeholder="20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget / Día (USD)</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  value={form.budgetPerDayUsd}
                  onChange={(e) => setForm({ ...form, budgetPerDayUsd: e.target.value })}
                  placeholder="5.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={updateAgent.isPending}>
            {updateAgent.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar Cambios
          </Button>
          <Link href={`/admin/nexus/projects/${projectId}/agents`}>
            <Button variant="outline">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
