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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  ArrowLeft,
  Activity,
  ChevronDown,
  Clock,
  DollarSign,
  Hash,
  Search,
} from 'lucide-react'
import { useTraces } from '@/lib/nexus/hooks/use-traces'
import type { NexusExecutionTrace } from '@/lib/nexus/types'

export default function TracesPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const { data: traces, isLoading } = useTraces(projectId)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = (traces || []).filter((trace: NexusExecutionTrace) => {
    if (statusFilter !== 'all' && trace.status !== statusFilter) return false
    if (searchQuery && !trace.sessionId.includes(searchQuery) && !trace.id.includes(searchQuery)) return false
    return true
  })

  const stats = {
    total: traces?.length || 0,
    running: traces?.filter((t: NexusExecutionTrace) => t.status === 'running').length || 0,
    completed: traces?.filter((t: NexusExecutionTrace) => t.status === 'completed').length || 0,
    errors: traces?.filter((t: NexusExecutionTrace) => t.status === 'error').length || 0,
    totalCost: traces?.reduce((sum: number, t: NexusExecutionTrace) => sum + (t.totalCost || 0), 0) || 0,
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
            <h1 className="text-3xl font-bold tracking-tight">Traces</h1>
            <p className="text-muted-foreground">
              Historial de ejecuciones y eventos de los agentes
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Traces</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">En Ejecución</p>
            <p className="text-2xl font-bold">{stats.running}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Completados</p>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Costo Total</p>
            <p className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por session ID o trace ID..."
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
            <SelectItem value="running">En ejecución</SelectItem>
            <SelectItem value="completed">Completados</SelectItem>
            <SelectItem value="error">Con error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Traces List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No hay traces disponibles</p>
          <p className="text-sm">Los traces aparecerán cuando los agentes ejecuten tareas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((trace: NexusExecutionTrace) => (
            <TraceCard key={trace.id} trace={trace} />
          ))}
        </div>
      )}
    </div>
  )
}

function TraceCard({ trace }: { trace: NexusExecutionTrace }) {
  const duration = trace.completedAt
    ? new Date(trace.completedAt).getTime() - new Date(trace.startedAt).getTime()
    : null

  return (
    <Collapsible>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    trace.status === 'completed'
                      ? 'default'
                      : trace.status === 'error'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {trace.status}
                </Badge>
                <div>
                  <CardTitle className="text-sm font-mono">
                    {trace.id.slice(0, 12)}...
                  </CardTitle>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      Session: {trace.sessionId.slice(0, 8)}...
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(trace.startedAt).toLocaleString('es-AR')}
                    </span>
                    {duration !== null && (
                      <span>{(duration / 1000).toFixed(1)}s</span>
                    )}
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${(trace.totalCost || 0).toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>Tokens: {trace.totalTokens || 0}</span>
                <span>Agent: {trace.agentId.slice(0, 8)}...</span>
              </div>
              {trace.events && trace.events.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Eventos ({trace.events.length})
                  </p>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {trace.events.map((event, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 rounded bg-muted/50 text-xs"
                      >
                        <Badge variant="outline" className="text-xs shrink-0">
                          {event.type}
                        </Badge>
                        <span className="text-muted-foreground shrink-0">
                          {new Date(event.timestamp).toLocaleTimeString('es-AR')}
                        </span>
                        <pre className="overflow-x-auto text-xs font-mono flex-1">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
