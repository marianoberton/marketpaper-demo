'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  File, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Trash2,
  Plus,
  Upload,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react'
import { 
  getProjectDocuments, 
  deleteProjectDocument,
  formatFileSize,
  type ProjectDocument
} from '@/lib/storage'
import { useWorkspace } from '@/components/workspace-context'
import { useDirectFileUpload } from '@/lib/hooks/useDirectFileUpload'
import { generateUniqueFilePath } from '@/lib/utils/file-utils'

interface DocumentCardProps {
  projectId: string
  title: string
  description?: string
  // Configuración de fechas
  requiresDates?: boolean
  startDate?: string
  endDate?: string
  startDateLabel?: string
  endDateLabel?: string
  onStartDateChange?: (date: string) => void
  onEndDateChange?: (date: string) => void
  // Configuración de documentación
  showNoDocumentationOption?: boolean
  noDocumentationRequired?: boolean
  onNoDocumentationChange?: (checked: boolean) => void
  // Configuración de archivos
  acceptedFileTypes?: string[]
  maxFileSize?: number
  allowMultipleFiles?: boolean
  // Callbacks
  onDocumentUploaded?: (document: ProjectDocument) => void
  onDocumentDeleted?: (documentId: string) => void
  // Estado visual
  variant?: 'default' | 'compact' | 'minimal'
  status?: 'pending' | 'in-progress' | 'completed' | 'not-required'
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) {
    return <ImageIcon className="h-5 w-5 text-blue-500" />
  }
  if (mimeType === 'application/pdf') {
    return <FileText className="h-5 w-5 text-red-500" />
  }
  return <File className="h-5 w-5 text-gray-500" />
}

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png'
}

export default function DocumentCard({
  projectId,
  title,
  description,
  requiresDates = false,
  startDate = '',
  endDate = '',
  startDateLabel = 'Fecha de inicio',
  endDateLabel = 'Fecha de fin',
  onStartDateChange,
  onEndDateChange,
  showNoDocumentationOption = false,
  noDocumentationRequired = false,
  onNoDocumentationChange,
  acceptedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'],
  maxFileSize = 100 * 1024 * 1024,
  allowMultipleFiles = true,
  onDocumentUploaded,
  onDocumentDeleted,
  variant = 'default',
  status = 'pending'
}: DocumentCardProps) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [noDocsRequired, setNoDocsRequired] = useState(noDocumentationRequired)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const workspace = useWorkspace()
  const { uploadFile, isUploading, progress } = useDirectFileUpload()

  // Cargar documentos existentes
  useEffect(() => {
    loadDocuments()
  }, [projectId, title])

  const loadDocuments = async (): Promise<void> => {
    try {
      setLoading(true)
      const docs = await getProjectDocuments(projectId)
      setDocuments(docs)
    } catch (error) {
      console.error('Error loading documents:', error)
      setError('Error al cargar documentos')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (files: FileList | null): void => {
    if (!files || files.length === 0) return
    
    const file = files[0]
    handleFileUpload(file)
  }

  const handleFileUpload = async (file: File): Promise<void> => {
    try {
      setError(null)
      
      // Validaciones
      if (file.size > maxFileSize) {
        setError(`El archivo es demasiado grande. Máximo ${Math.round(maxFileSize / (1024 * 1024))}MB`)
        return
      }

      if (!acceptedFileTypes.includes(file.type)) {
        setError('Tipo de archivo no permitido')
        return
      }

      // Generar path único
      const uniquePath = generateUniqueFilePath({
        companyId: workspace.companyId || '',
        projectId,
        section: title,
        fileName: file.name
      })
      
      // Subir archivo
      const result = await uploadFile({
        bucket: 'construction-documents',
        path: uniquePath,
        file
      })

      if (result.success && result.publicUrl) {
        // Crear el documento en la base de datos
        const documentData = {
          project_id: projectId,
          section_name: title,
          filename: uniquePath.split('/').pop() || file.name,
          original_filename: file.name,
          file_url: result.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          description: description || `Documento de ${title}`,
          uploaded_by: workspace.userEmail || 'unknown'
        }
        
        // Aquí necesitarías una función para crear el documento en la DB
        // Por ahora, solo recargamos los documentos
        await loadDocuments()
        // onDocumentUploaded?.(documentData as ProjectDocument)
      } else {
        setError(result.error || 'Error al subir archivo')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      setError('Error al subir archivo')
    }
  }

  const handleDelete = async (documentId: string): Promise<void> => {
    try {
      await deleteProjectDocument(documentId)
      await loadDocuments()
      onDocumentDeleted?.(documentId)
    } catch (error) {
      console.error('Error deleting document:', error)
      setError('Error al eliminar documento')
    }
  }

  const handleNoDocsChange = (checked: boolean): void => {
    setNoDocsRequired(checked)
    onNoDocumentationChange?.(checked)
  }

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent): void => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const acceptString = acceptedFileTypes.map(type => 
    MIME_TO_EXT[type] || `.${type.split('/')[1]}`
  ).join(',')

  // Determinar el estado visual
  const getStatusInfo = () => {
    if (noDocsRequired) {
      return { color: 'bg-gray-100 border-gray-200', badge: 'No requerido', badgeColor: 'bg-gray-500' }
    }
    if (documents.length > 0) {
      return { color: 'bg-green-50 border-green-200', badge: 'Completado', badgeColor: 'bg-green-500' }
    }
    if (isUploading) {
      return { color: 'bg-blue-50 border-blue-200', badge: 'Subiendo...', badgeColor: 'bg-blue-500' }
    }
    return { color: 'bg-white border-gray-200', badge: 'Pendiente', badgeColor: 'bg-yellow-500' }
  }

  const statusInfo = getStatusInfo()

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${statusInfo.color} ${isDragOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}>
      <CardContent className="p-5">
        {/* Header mejorado */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-base text-gray-900 mb-1">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
            )}
          </div>
          <Badge 
            variant="secondary" 
            className={`${statusInfo.badgeColor} text-white text-xs px-3 py-1 font-medium shadow-sm`}
          >
            {statusInfo.badge}
          </Badge>
        </div>

        {/* Checkbox "No requiere documentación" mejorado */}
        {showNoDocumentationOption && (
          <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <input
              type="checkbox"
              id={`no-docs-${title.replace(/\s+/g, '-').toLowerCase()}`}
              checked={noDocsRequired}
              onChange={(e) => handleNoDocsChange(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
            />
            <label 
              htmlFor={`no-docs-${title.replace(/\s+/g, '-').toLowerCase()}`} 
              className="text-sm text-gray-700 font-medium cursor-pointer"
            >
              No requiere documentación
            </label>
          </div>
        )}

        {/* Campos de fecha mejorados */}
        {requiresDates && (
          <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">Fechas del proceso</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">{startDateLabel}</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange?.(e.target.value)}
                  className="text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">{endDateLabel}</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange?.(e.target.value)}
                  className="text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* Error mejorado */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700 font-medium">{error}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setError(null)}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100 transition-colors"
            >
              ×
            </Button>
          </div>
        )}

        {/* Área de carga mejorada */}
        {!noDocsRequired && (
          <div className="space-y-4">
            {/* Drop zone mejorado */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
                ${isDragOver ? 'border-blue-400 bg-blue-50 scale-[1.02]' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
                ${isUploading ? 'pointer-events-none opacity-50' : ''}
              `}
            >
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700 mb-2">
                {isUploading ? 'Subiendo archivo...' : 'Arrastra archivos aquí o haz clic para seleccionar'}
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Formatos: {acceptedFileTypes.map(type => MIME_TO_EXT[type] || type).join(', ')} • Tamaño máximo: {Math.round(maxFileSize / (1024 * 1024))}MB
              </p>
              
              {/* Barra de progreso mejorada */}
              {isUploading && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-blue-600 mt-2 font-medium">{Math.round(progress)}% completado</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={acceptString}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              multiple={allowMultipleFiles}
            />
          </div>
        )}

        {/* Lista de documentos mejorada */}
        {!noDocsRequired && documents.length > 0 && (
          <div className="mt-5 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos cargados ({documents.length})
            </h4>
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {getFileIcon(doc.mime_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.original_filename}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <File className="h-3 w-3" />
                        {formatFileSize(doc.file_size)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(doc.file_url, '_blank')}
                    className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Descargar archivo"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(doc.id)}
                    className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Eliminar archivo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estado "No requiere documentación" mejorado */}
        {noDocsRequired && (
          <div className="text-center py-6 bg-gray-50 border border-gray-200 rounded-lg">
            <CheckCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">Esta sección no requiere documentación</p>
            <p className="text-xs text-gray-500 mt-1">Puedes continuar con el siguiente paso</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}