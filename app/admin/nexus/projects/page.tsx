'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  Plus,
  Search,
  Folder,
  Bot,
  DollarSign,
  Settings,
  ArrowLeft,
} from 'lucide-react'
import { nexusApi } from '@/lib/nexus/api'
import type { NexusProject } from '@/lib/nexus/types'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<NexusProject[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    nexusApi
      .listProjects()
      .then((res) => setProjects(res.items || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/nexus">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Proyectos</h1>
            <p className="text-muted-foreground">Gestión de proyectos Nexus Core</p>
          </div>
        </div>
        <Link href="/admin/nexus/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar proyectos..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Folder className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">
            {search ? 'No se encontraron proyectos' : 'No hay proyectos aún'}
          </p>
          {!search && (
            <Link href="/admin/nexus/projects/new">
              <Button variant="link">Crear el primero</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <Link
              key={project.id}
              href={`/admin/nexus/projects/${project.id}`}
              className="block"
            >
              <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-semibold text-sm">
                          {project.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-base">{project.name}</CardTitle>
                      </div>
                    </div>
                    <Badge
                      variant={
                        project.status === 'active'
                          ? 'default'
                          : project.status === 'paused'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Bot className="h-3 w-3" />
                      <span>{project.config?.provider?.model || '—'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Settings className="h-3 w-3" />
                      <span>{project.config?.allowedTools?.length || 0} tools</span>
                    </div>
                    {project.config?.costConfig && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>${project.config.costConfig.dailyBudgetUSD}/día</span>
                      </div>
                    )}
                  </div>
                  {project.config?.mcpServers && project.config.mcpServers.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.config.mcpServers.map((mcp) => (
                        <Badge key={mcp.name} variant="outline" className="text-xs">
                          MCP: {mcp.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
