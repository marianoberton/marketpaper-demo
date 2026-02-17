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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Brain,
  Plus,
  Search,
  Star,
  Trash2,
  Loader2,
} from 'lucide-react'
import { useMemory, useCreateMemory, useDeleteMemory, useSearchMemory } from '@/lib/nexus/hooks/use-memory'
import type { MemoryEntry } from '@/lib/nexus/types'
import { toast } from 'sonner'

const CATEGORIES = ['fact', 'decision', 'preference', 'task_context', 'learning', 'catalog_product']

export default function MemoryPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const { data: memories, isLoading } = useMemory(projectId)
  const createMemory = useCreateMemory(projectId)
  const deleteMemory = useDeleteMemory(projectId)
  const searchMemory = useSearchMemory(projectId)

  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MemoryEntry[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newEntry, setNewEntry] = useState({ content: '', category: 'fact', importance: '0.5' })

  const displayData = searchResults || memories || []
  const filtered = displayData.filter((entry: MemoryEntry) => {
    if (categoryFilter !== 'all' && entry.category !== categoryFilter) return false
    return true
  })

  async function handleSearch() {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    setIsSearching(true)
    try {
      const result = await searchMemory.mutateAsync({ query: searchQuery, limit: 20 })
      setSearchResults(result.items || result.data || [])
    } catch {
      toast.error('Error en búsqueda semántica')
    } finally {
      setIsSearching(false)
    }
  }

  async function handleCreate() {
    try {
      await createMemory.mutateAsync({
        content: newEntry.content,
        category: newEntry.category,
        importance: parseFloat(newEntry.importance),
      })
      toast.success('Entrada de memoria creada')
      setCreateOpen(false)
      setNewEntry({ content: '', category: 'fact', importance: '0.5' })
    } catch {
      toast.error('Error al crear entrada')
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteMemory.mutateAsync(deleteId)
      toast.success('Entrada eliminada')
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
            <h1 className="text-3xl font-bold tracking-tight">Memoria</h1>
            <p className="text-muted-foreground">
              Base de conocimiento del proyecto con embeddings vectoriales
            </p>
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Entrada
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Entrada de Memoria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Contenido</Label>
                <Textarea
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                  rows={4}
                  placeholder="Información que el agente debe recordar..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select
                    value={newEntry.category}
                    onValueChange={(v) => setNewEntry({ ...newEntry, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Importancia (0-1)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={newEntry.importance}
                    onChange={(e) => setNewEntry({ ...newEntry, importance: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createMemory.isPending || !newEntry.content}>
                {createMemory.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Entradas</p>
                <p className="text-2xl font-bold">{memories?.length || 0}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Categorías</p>
            <p className="text-2xl font-bold">
              {new Set((memories || []).map((m: MemoryEntry) => m.category).filter(Boolean)).size}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Resultados Búsqueda</p>
            <p className="text-2xl font-bold">
              {searchResults ? searchResults.length : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Búsqueda semántica..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={handleSearch} disabled={isSearching}>
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
        </Button>
        {searchResults && (
          <Button variant="ghost" onClick={() => { setSearchResults(null); setSearchQuery('') }}>
            Limpiar
          </Button>
        )}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Memory List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No hay entradas de memoria</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((entry: MemoryEntry) => (
            <Card key={entry.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {entry.category && (
                      <Badge variant="outline">{entry.category}</Badge>
                    )}
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.round((entry.importance || 0) * 5)
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(entry.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-3">{entry.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(entry.createdAt).toLocaleString('es-AR')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar entrada?</AlertDialogTitle>
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
