'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  File, 
  FileText, 
  Image as ImageIcon, 
  X, 
  Download, 
  Trash2,
  Plus,
  AlertCircle 
} from 'lucide-react'
import { 
  uploadProjectDocument, 
  getProjectDocuments, 
  deleteProjectDocument,
  validateFileType,
  formatFileSize,
  ALLOWED_FILE_TYPES,
  type ProjectDocument,
  type DocumentUpload
} from '@/lib/storage'
import { useFileUpload } from '@/lib/hooks/useFileUpload'

interface DocumentUploadProps {
  projectId: string
  sectionName: string
  onDocumentUploaded?: (document: ProjectDocument) => void
  onDocumentDeleted?: (documentId: string) => void
}

export default function DocumentUpload({ 
  projectId, 
  sectionName, 
  onDocumentUploaded,
  onDocumentDeleted 
}: DocumentUploadProps) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Sincronizar estado del hook con estado local
  useEffect(() => {
    setUploading(hookIsUploading)
    setUploadProgress(hookUploadProgress.progress)
  }, [hookIsUploading, hookUploadProgress.progress])
  const [error, setError] = useState<string | null>(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar documentos al montar el componente
  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      const docs = await getProjectDocuments(projectId)
      const sectionDocs = docs.filter(doc => doc.section_name === sectionName)
      setDocuments(sectionDocs)
    } catch (error: any) {
      console.error('Error loading documents:', error)
      setError('Error al cargar los documentos')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    const allowedTypes = [...(ALLOWED_FILE_TYPES[sectionName as keyof typeof ALLOWED_FILE_TYPES] || [])]
    if (!validateFileType(file, allowedTypes)) {
      setError('Tipo de archivo no permitido para esta sección')
      return
    }

    // Validar tamaño (máximo 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('El archivo es demasiado grande. Máximo 50MB.')
      return
    }

    handleUpload(file)
  }

  // Hook para manejar subidas de archivos con Vercel Blob
  const { uploadFile, uploadProgress: hookUploadProgress, isUploading: hookIsUploading } = useFileUpload({
    maxSize: 50 * 1024 * 1024, // 50MB
    onSuccess: async (fileUrl, fileName) => {
      try {
        // Crear documento en la base de datos usando la URL de Vercel Blob
        const uploadData: DocumentUpload = {
          file: new File([], fileName), // Archivo dummy para compatibilidad
          projectId,
          sectionName,
          description: description.trim() || undefined,
          fileUrl // Pasar la URL de Vercel Blob
        }

        const document = await uploadProjectDocument(uploadData)
        
        // Actualizar lista de documentos
        setDocuments(prev => [document, ...prev])
        
        // Limpiar formulario
        setDescription('')
        setShowUploadForm(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        // Notificar al componente padre
        onDocumentUploaded?.(document)
      } catch (error: any) {
        console.error('Error saving document to database:', error)
        setError(error.message || 'Error al guardar el documento')
      }
    },
    onError: (error) => {
      setError(error)
    }
  })

  const handleUpload = async (file: File) => {
    try {
      setError(null)
      // El hook maneja automáticamente si usar Vercel Blob o método tradicional
      await uploadFile(file, '/api/workspace/construction/documents')
    } catch (error: any) {
      console.error('Upload error:', error)
      // El error ya se maneja en el hook
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este documento?')) {
      return
    }

    try {
      setError(null)
      await deleteProjectDocument(documentId)
      
      // Actualizar lista de documentos
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      
      // Notificar al componente padre
      onDocumentDeleted?.(documentId)

    } catch (error: any) {
      console.error('Delete error:', error)
      setError(error.message || 'Error al eliminar el documento')
    }
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

  const allowedTypes = ALLOWED_FILE_TYPES[sectionName as keyof typeof ALLOWED_FILE_TYPES] || []
  const acceptString = allowedTypes.map(type => 
    type.endsWith('/*') ? type : `.${type.split('/')[1]}`
  ).join(',')

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Cargando documentos...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{sectionName}</CardTitle>
          <Button
            onClick={() => setShowUploadForm(!showUploadForm)}
            size="sm"
            variant={showUploadForm ? "outline" : "default"}
          >
            <Plus className="h-4 w-4 mr-2" />
            {showUploadForm ? 'Cancelar' : 'Subir Documento'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mostrar errores */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}

        {/* Formulario de subida */}
        {showUploadForm && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Describe brevemente el documento..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="file">Seleccionar archivo</Label>
              <Input
                ref={fileInputRef}
                id="file"
                type="file"
                accept={acceptString}
                onChange={handleFileSelect}
                disabled={uploading}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tipos permitidos: PDF, imágenes, documentos de Word/Excel. Máximo 50MB.
              </p>
            </div>

            {/* Barra de progreso */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {hookUploadProgress.fileName ? 
                      `Subiendo ${hookUploadProgress.fileName}...` : 
                      'Subiendo archivo...'
                    }
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                {uploadProgress > 90 && (
                  <p className="text-xs text-muted-foreground">
                    Finalizando subida y guardando en base de datos...
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Lista de documentos */}
        {documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(doc.mime_type)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {doc.original_filename}
                    </h4>
                    {doc.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {doc.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(doc.file_url, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium text-muted-foreground mb-1">
              No hay documentos cargados
            </h3>
            <p className="text-sm text-muted-foreground">
              Sube documentos relacionados con {sectionName.toLowerCase()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}