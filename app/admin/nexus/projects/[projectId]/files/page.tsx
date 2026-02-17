'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  FileIcon,
  FileText,
  FileImage,
  Trash2,
  Download,
  HardDrive,
} from 'lucide-react'
import { nexusApi } from '@/lib/nexus/api'
import { toast } from 'sonner'

interface ProjectFile {
  id: string
  filename: string
  mimeType: string
  size: number
  expiresAt?: string
  createdAt: string
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage
  if (mimeType.includes('pdf') || mimeType.includes('text')) return FileText
  return FileIcon
}

export default function FilesPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    nexusApi
      .get<{ items?: ProjectFile[]; data?: ProjectFile[] }>(`/projects/${projectId}/files`)
      .then((res) => setFiles(res.items || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId])

  async function handleDelete() {
    if (!deleteId) return
    try {
      await nexusApi.delete(`/projects/${projectId}/files/${deleteId}`)
      setFiles((prev) => prev.filter((f) => f.id !== deleteId))
      toast.success('Archivo eliminado')
      setDeleteId(null)
    } catch {
      toast.error('Error al eliminar')
    }
  }

  async function handleDownload(fileId: string, filename: string) {
    try {
      const result = await nexusApi.get<{ url: string }>(`/projects/${projectId}/files/${fileId}/url`)
      const a = document.createElement('a')
      a.href = result.url
      a.download = filename
      a.click()
    } catch {
      toast.error('Error al descargar')
    }
  }

  const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/nexus/projects/${projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Archivos</h1>
          <p className="text-muted-foreground">
            Archivos del proyecto
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Archivos</p>
                <p className="text-2xl font-bold">{files.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <FileIcon className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tamaño Total</p>
                <p className="text-2xl font-bold">{formatBytes(totalSize)}</p>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <HardDrive className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Files List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No hay archivos</p>
          <p className="text-sm">Los archivos aparecerán cuando los agentes los generen</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => {
            const Icon = getFileIcon(file.mimeType)
            return (
              <Card key={file.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{file.filename}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <Badge variant="outline" className="text-xs">{file.mimeType}</Badge>
                          <span>{formatBytes(file.size)}</span>
                          <span>{new Date(file.createdAt).toLocaleDateString('es-AR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownload(file.id, file.filename)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(file.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
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
