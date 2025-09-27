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
  document
}: DocumentPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true)

  if (!document) return null

  const isPDF = document.type === 'application/pdf' || document.name.toLowerCase().endsWith('.pdf')
  const isImage = document.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(document.name)

  const handleDownload = (): void => {
    const link = document.createElement('a')
    link.href = document.url
    link.download = document.name
    link.click()
  }

  const handleOpenExternal = (): void => {
    window.open(document.url, '_blank')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] p-0 sm:max-w-[95vw]">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">
                {document.name}
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Subido el {new Date(document.uploadDate).toLocaleDateString('es-ES', {
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Cargando vista previa...</span>
            </div>
          )}

          {isPDF && (
            <iframe
              src={`${document.url}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-[600px] border rounded-lg"
              onLoad={() => setIsLoading(false)}
              style={{ display: isLoading ? 'none' : 'block' }}
              title={`Vista previa de ${document.name}`}
            />
          )}

          {isImage && (
            <div className="flex justify-center">
              <img
                src={document.url}
                alt={document.name}
                className="max-w-full max-h-[600px] object-contain rounded-lg shadow-lg"
                onLoad={() => setIsLoading(false)}
                style={{ display: isLoading ? 'none' : 'block' }}
              />
            </div>
          )}

          {!isPDF && !isImage && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Vista previa no disponible
              </h3>
              <p className="text-gray-600 mb-4">
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