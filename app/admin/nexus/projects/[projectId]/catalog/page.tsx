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
  ShoppingBag,
  Search,
  Trash2,
  DollarSign,
  Package,
  Loader2,
} from 'lucide-react'
import { useCatalog, useSearchCatalog, useDeleteCatalogItem } from '@/lib/nexus/hooks/use-catalog'
import type { CatalogItem } from '@/lib/nexus/types'
import { toast } from 'sonner'

export default function CatalogPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const { data: items, isLoading } = useCatalog(projectId)
  const searchCatalog = useSearchCatalog(projectId)
  const deleteCatalogItem = useDeleteCatalogItem(projectId)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CatalogItem[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const displayData = searchResults || items || []

  async function handleSearch() {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    setIsSearching(true)
    try {
      const result = await searchCatalog.mutateAsync(searchQuery)
      setSearchResults(result.data)
    } catch {
      toast.error('Error en búsqueda')
    } finally {
      setIsSearching(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteCatalogItem.mutateAsync(deleteId)
      toast.success('Producto eliminado')
      setDeleteId(null)
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const categories = [...new Set((items || []).map((i: CatalogItem) => i.category).filter(Boolean))]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/nexus/projects/${projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo</h1>
          <p className="text-muted-foreground">
            Productos disponibles con búsqueda semántica
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Productos</p>
                <p className="text-2xl font-bold">{items?.length || 0}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Categorías</p>
            <p className="text-2xl font-bold">{categories.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Resultados Búsqueda</p>
            <p className="text-2xl font-bold">{searchResults ? searchResults.length : '—'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Búsqueda semántica de productos..."
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
      </div>

      {/* Products List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : displayData.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No hay productos en el catálogo</p>
          <p className="text-sm">Sube un CSV para poblar el catálogo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayData.map((item: CatalogItem) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.name}</p>
                        <Badge variant="outline" className="text-xs font-mono">
                          {item.sku}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        {item.description && (
                          <span className="line-clamp-1 max-w-xs">{item.description}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.category && (
                      <Badge variant="secondary">{item.category}</Badge>
                    )}
                    {item.price !== undefined && item.price !== null && (
                      <span className="flex items-center text-sm font-medium">
                        <DollarSign className="h-3.5 w-3.5" />
                        {item.price.toFixed(2)}
                      </span>
                    )}
                    {item.stock !== undefined && item.stock !== null && (
                      <span className="text-xs text-muted-foreground">
                        Stock: {item.stock}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
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
