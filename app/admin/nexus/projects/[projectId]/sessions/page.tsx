'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  MessageSquare,
  Search,
  StopCircle,
  Activity,
  Clock,
} from 'lucide-react'
import { useSessions, useTerminateSession } from '@/lib/nexus/hooks/use-sessions'
import type { NexusSession } from '@/lib/nexus/types'
import { toast } from 'sonner'

export default function SessionsPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const { data: sessions, isLoading } = useSessions(projectId)
  const terminateSession = useTerminateSession(projectId)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [terminateId, setTerminateId] = useState<string | null>(null)

  const filtered = (sessions || []).filter((session: NexusSession) => {
    if (statusFilter !== 'all' && session.status !== statusFilter) return false
    if (searchQuery && !session.id.includes(searchQuery)) return false
    return true
  })

  const stats = {
    total: sessions?.length || 0,
    active: sessions?.filter((s: NexusSession) => s.status === 'active').length || 0,
    completed: sessions?.filter((s: NexusSession) => s.status === 'completed').length || 0,
  }

  async function handleTerminate() {
    if (!terminateId) return
    try {
      await terminateSession.mutateAsync(terminateId)
      toast.success('Sesión terminada')
      setTerminateId(null)
    } catch {
      toast.error('Error al terminar sesión')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/nexus/projects/${projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sesiones</h1>
          <p className="text-muted-foreground">
            Sesiones de conversación activas y completadas
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Activas</p>
            <p className="text-2xl font-bold text-green-500">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Completadas</p>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por session ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
            <SelectItem value="expired">Expiradas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sessions List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No hay sesiones</p>
          <p className="text-sm">Las sesiones aparecerán cuando los agentes sean utilizados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((session: NexusSession) => (
            <Card key={session.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-medium">
                        {session.id.slice(0, 16)}...
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        {session.agentId && (
                          <span>Agent: {session.agentId.slice(0, 8)}...</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(session.createdAt).toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        session.status === 'active'
                          ? 'default'
                          : session.status === 'expired'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {session.status}
                    </Badge>
                    <Link href={`/admin/nexus/projects/${projectId}/traces`}>
                      <Button variant="outline" size="sm">
                        <Activity className="mr-1 h-3 w-3" />
                        Traces
                      </Button>
                    </Link>
                    {session.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setTerminateId(session.id)}
                      >
                        <StopCircle className="mr-1 h-3 w-3" />
                        Terminar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Terminate Confirmation */}
      <AlertDialog open={!!terminateId} onOpenChange={() => setTerminateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Terminar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción finalizará la sesión activa. El agente dejará de responder en esta conversación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTerminate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Terminar Sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
