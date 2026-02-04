'use client'

import { useState, useRef, useCallback } from 'react'
import { useDirectFileUpload } from '@/lib/hooks/useDirectFileUpload'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ImagePlus,
  X,
  FileImage,
  File as FileIcon,
  Loader2,
  AlertCircle
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface UploadedAttachment {
  id?: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  publicUrl: string
}

interface TicketAttachmentUploadProps {
  ticketId?: string
  companyId: string
  onAttachmentUploaded?: (attachment: UploadedAttachment) => void
  onAttachmentRemoved?: (index: number) => void
  attachments?: UploadedAttachment[]
  maxFiles?: number
  disabled?: boolean
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

function sanitizeFileName(name: string): string {
  return name
    .replace(/\s+/g, '_')
    .replace(/[<>:"|?*\\\/]/g, '')
    .replace(/[^\w.-]/g, '')
}

export function TicketAttachmentUpload({
  ticketId,
  companyId,
  onAttachmentUploaded,
  onAttachmentRemoved,
  attachments = [],
  maxFiles = 5,
  disabled = false
}: TicketAttachmentUploadProps) {
  const { uploadFile, isUploading, progress } = useDirectFileUpload()
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setError(null)

    // Check max files
    if (attachments.length + files.length > maxFiles) {
      setError(`Maximo ${maxFiles} archivos permitidos`)
      return
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Validate type
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`Tipo de archivo no permitido: ${file.name}. Solo imagenes (JPG, PNG, GIF, WebP) y PDF.`)
        continue
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        setError(`Archivo muy grande: ${file.name}. Maximo 25MB.`)
        continue
      }

      // Generate unique path
      const timestamp = Date.now()
      const sanitizedName = sanitizeFileName(file.name)
      const ticketPath = ticketId || 'pending'
      const path = `${companyId}/${ticketPath}/${timestamp}-${sanitizedName}`

      try {
        const result = await uploadFile({
          bucket: 'ticket-attachments',
          path,
          file
        })

        if (result.success && result.publicUrl) {
          const attachment: UploadedAttachment = {
            file_name: file.name,
            file_path: path,
            file_size: file.size,
            file_type: file.type,
            publicUrl: result.publicUrl
          }

          // If we have a ticketId, register the attachment in the database
          if (ticketId) {
            try {
              const response = await fetch(`/api/workspace/tickets/${ticketId}/attachments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  file_name: file.name,
                  file_path: path,
                  file_size: file.size,
                  file_type: file.type
                })
              })

              const data = await response.json()
              if (data.success && data.attachment) {
                attachment.id = data.attachment.id
              }
            } catch (err) {
              console.error('Error registering attachment:', err)
            }
          }

          onAttachmentUploaded?.(attachment)
          toast.success(`Archivo subido: ${file.name}`)
        } else {
          setError(result.error || 'Error al subir archivo')
          toast.error(`Error al subir: ${file.name}`)
        }
      } catch (err) {
        console.error('Upload error:', err)
        setError('Error al subir archivo')
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [uploadFile, ticketId, companyId, attachments.length, maxFiles, onAttachmentUploaded])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (disabled || isUploading) return
    handleFileSelect(e.dataTransfer.files)
  }, [disabled, isUploading, handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleRemove = useCallback((index: number) => {
    onAttachmentRemoved?.(index)
  }, [onAttachmentRemoved])

  const isImage = (type: string) => type.startsWith('image/')

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center transition-colors
          ${disabled || isUploading
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled || isUploading}
          className="hidden"
          id="ticket-attachment-input"
        />

        {isUploading ? (
          <div className="space-y-2">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
            <p className="text-sm text-gray-500">Subiendo...</p>
            <Progress value={progress} className="w-full max-w-xs mx-auto h-2" />
          </div>
        ) : (
          <label
            htmlFor="ticket-attachment-input"
            className={`flex flex-col items-center gap-2 ${disabled ? '' : 'cursor-pointer'}`}
          >
            <ImagePlus className="h-8 w-8 text-gray-400" />
            <span className="text-sm text-gray-600">
              Arrastra imagenes aqui o <span className="text-blue-600 font-medium">selecciona</span>
            </span>
            <span className="text-xs text-gray-400">
              JPG, PNG, GIF, WebP o PDF (max 25MB)
            </span>
          </label>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 w-6 p-0"
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Uploaded Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div
              key={attachment.file_path}
              className="relative group border rounded-lg overflow-hidden bg-gray-50"
            >
              {isImage(attachment.file_type) ? (
                <div className="relative w-20 h-20">
                  <Image
                    src={attachment.publicUrl}
                    alt={attachment.file_name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 flex flex-col items-center justify-center p-2">
                  <FileIcon className="h-8 w-8 text-red-500" />
                  <span className="text-xs text-gray-500 truncate w-full text-center">
                    PDF
                  </span>
                </div>
              )}

              {/* Remove button */}
              {!disabled && (
                <button
                  onClick={() => handleRemove(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* File count */}
      {attachments.length > 0 && (
        <p className="text-xs text-gray-400">
          {attachments.length} de {maxFiles} archivos
        </p>
      )}
    </div>
  )
}

// Compact version for message reply box
export function TicketAttachmentButton({
  ticketId,
  companyId,
  onAttachmentUploaded,
  disabled = false
}: {
  ticketId: string
  companyId: string
  onAttachmentUploaded: (attachment: UploadedAttachment) => void
  disabled?: boolean
}) {
  const { uploadFile, isUploading } = useDirectFileUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]

    // Validate
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Tipo de archivo no permitido')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Archivo muy grande (max 25MB)')
      return
    }

    const timestamp = Date.now()
    const sanitizedName = sanitizeFileName(file.name)
    const path = `${companyId}/${ticketId}/${timestamp}-${sanitizedName}`

    const result = await uploadFile({
      bucket: 'ticket-attachments',
      path,
      file
    })

    if (result.success && result.publicUrl) {
      // Register in database
      try {
        const response = await fetch(`/api/workspace/tickets/${ticketId}/attachments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_name: file.name,
            file_path: path,
            file_size: file.size,
            file_type: file.type
          })
        })

        const data = await response.json()

        onAttachmentUploaded({
          id: data.attachment?.id,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          file_type: file.type,
          publicUrl: result.publicUrl
        })

        toast.success('Imagen adjuntada')
      } catch (err) {
        console.error('Error registering attachment:', err)
        toast.error('Error al registrar adjunto')
      }
    } else {
      toast.error(result.error || 'Error al subir imagen')
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={disabled || isUploading}
        className="hidden"
        id="ticket-message-attachment"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled || isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
      </Button>
    </>
  )
}
