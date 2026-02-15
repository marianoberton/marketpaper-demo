'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Download, ExternalLink } from 'lucide-react'

interface DocumentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  document: {
    id: string
    name: string
    url: string
    type: string
    size: number
    uploadDate: string
  } | null
}

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  document: doc
}: DocumentPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true)

  if (!doc) return null

  const isPDF = doc.type === 'application/pdf' || doc.name.toLowerCase().endsWith('.pdf')
  const isImage = doc.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.name)

  const handleDownload = (): void => {
    const link = document.createElement('a')
    link.href = doc.url
    link.download = doc.name
    link.click()
  }

  const handleOpenExternal = (): void => {
    window.open(doc.url, '_blank')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] p-0 sm:max-w-[95vw]">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">
                {doc.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Subido el {new Date(doc.uploadDate).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenExternal}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6 overflow-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Cargando vista previa...</span>
            </div>
          )}

          {isPDF && (
            <iframe
              src={`${doc.url}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-[600px] border rounded-lg"
              onLoad={() => setIsLoading(false)}
              style={{ display: isLoading ? 'none' : 'block' }}
              title={`Vista previa de ${doc.name}`}
            />
          )}

          {isImage && (
            <div className="flex justify-center">
              <img
                src={doc.url}
                alt={doc.name}
                className="max-w-full max-h-[600px] object-contain rounded-lg shadow-lg"
                onLoad={() => setIsLoading(false)}
                style={{ display: isLoading ? 'none' : 'block' }}
              />
            </div>
          )}

          {!isPDF && !isImage && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Vista previa no disponible
              </h3>
              <p className="text-muted-foreground mb-4">
                Este tipo de archivo no se puede previsualizar en el navegador.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleDownload} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Descargar archivo
                </Button>
                <Button variant="outline" onClick={handleOpenExternal} className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Abrir en nueva ventana
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
