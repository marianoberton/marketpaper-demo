'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  FileCode2,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  ListChecks,
  Search,
  LayoutGrid,
  List,
} from 'lucide-react'
import { TemasNav } from '../components/temas-nav'

interface TemaType {
  id: string
  name: string
  description: string | null
  color: string
  icon: string | null
  gerencia: string | null
  categoria: string | null
  tareas_template: Array<{
    orden: number
    titulo: string
    tipo?: string
    checklist?: string[]
    dias_estimados?: number
  }> | null
  is_active: boolean
  sort_order: number | null
  created_at: string
}

const GERENCIA_LABELS: Record<string, string> = {
  construccion: 'Construccion',
  licitaciones: 'Licitaciones',
}

export default function TemplatesClientPage() {
  const [templates, setTemplates] = useState<TemaType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/workspace/temas/types')
      const data = await response.json()
      if (data.success) {
        setTemplates(data.types || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Error al cargar templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/workspace/temas/types/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Template eliminado correctamente')
        setTemplates((prev) => prev.filter((t) => t.id !== id))
      } else {
        toast.error(data.error || 'Error al eliminar template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Error al eliminar template')
    }
  }

  const filtered = templates.filter((t) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      t.name.toLowerCase().includes(q) ||
      (t.gerencia?.toLowerCase().includes(q) ?? false) ||
      (t.categoria?.toLowerCase().includes(q) ?? false) ||
      (t.description?.toLowerCase().includes(q) ?? false)
    )
  })

  const DeleteButton = ({ template }: { template: TemaType }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar template</AlertDialogTitle>
          <AlertDialogDescription>
            Estas seguro de que quieres eliminar el template &quot;{template.name}&quot;?
            Los temas existentes creados con este template no se veran afectados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => handleDelete(template.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return (
    <div className="p-6 space-y-6">
      <TemasNav />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileCode2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Templates de Tramites</h1>
            <p className="text-muted-foreground">
              Plantillas reutilizables para crear temas con tareas predefinidas
            </p>
          </div>
        </div>
        <Button asChild className="gap-2">
          <Link href="/workspace/temas/templates/nuevo">
            <Plus className="h-4 w-4" />
            Nuevo Template
          </Link>
        </Button>
      </div>

      {/* Toolbar: search + view toggle */}
      {!loading && templates.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-1 border border-border rounded-md p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <FileCode2 className="h-12 w-12 mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium">No hay templates</p>
          <p className="text-sm">Crea tu primer template para agilizar la creacion de temas</p>
          <Button asChild className="mt-4">
            <Link href="/workspace/temas/templates/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Template
            </Link>
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Search className="h-10 w-10 mb-3 text-muted-foreground/50" />
          <p className="font-medium">Sin resultados</p>
          <p className="text-sm">No hay templates que coincidan con &quot;{searchQuery}&quot;</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((template) => {
            const taskCount = template.tareas_template?.length ?? 0

            return (
              <Card
                key={template.id}
                className="overflow-hidden hover:border-primary/50 transition-all hover:shadow-sm"
              >
                {/* Color bar */}
                <div
                  className="h-1"
                  style={{ backgroundColor: template.color || '#6B7280' }}
                />

                <CardContent className="pt-5 space-y-3">
                  {/* Name & Description */}
                  <div>
                    <h3 className="font-semibold text-foreground truncate">
                      {template.name}
                    </h3>
                    {template.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {template.description}
                      </p>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {template.gerencia && (
                      <Badge variant="outline" className="text-xs">
                        {GERENCIA_LABELS[template.gerencia] || template.gerencia}
                      </Badge>
                    )}
                    {template.categoria && (
                      <Badge variant="secondary" className="text-xs">
                        {template.categoria}
                      </Badge>
                    )}
                  </div>

                  {/* Task count */}
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <ListChecks className="h-3.5 w-3.5" />
                    <span>
                      {taskCount} tarea{taskCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5"
                      asChild
                    >
                      <Link href={`/workspace/temas/templates/${template.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Link>
                    </Button>
                    <DeleteButton template={template} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        /* List view */
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-8"></TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Gerencia</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead className="w-24 text-center">Tareas</TableHead>
                <TableHead className="w-28 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((template) => {
                const taskCount = template.tareas_template?.length ?? 0
                return (
                  <TableRow key={template.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: template.color || '#6B7280' }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium text-foreground">{template.name}</span>
                        {template.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {template.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {template.gerencia ? (
                        <Badge variant="outline" className="text-xs">
                          {GERENCIA_LABELS[template.gerencia] || template.gerencia}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {template.categoria ? (
                        <Badge variant="secondary" className="text-xs">
                          {template.categoria}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                        <ListChecks className="h-3.5 w-3.5" />
                        {taskCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                          <Link href={`/workspace/temas/templates/${template.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <DeleteButton template={template} />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
