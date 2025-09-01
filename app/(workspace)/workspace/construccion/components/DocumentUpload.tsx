'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  File, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Trash2,
  Plus,
  AlertCircle,
  Upload 
} from 'lucide-react'
import { 
  getProjectDocuments, 
  deleteProjectDocument,
  formatFileSize,
  ALLOWED_FILE_TYPES,
  type ProjectDocument
} from '@/lib/storage'
import { useWorkspace } from '@/components/workspace-context'
import { UnifiedFileUpload } from '@/components/UnifiedFileUpload'

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
  const [error, setError] = useState<string | null>(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const workspace = useWorkspace()

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





  const handleUploadSuccess = (document: any) => {
    // Actualizar lista de documentos
    setDocuments(prev => [document, ...prev])
    
    // Notificar al componente padre
    onDocumentUploaded?.(document)
    
    // Cerrar formulario de subida
    setShowUploadForm(false)
    setError(null)
  }

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage)
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
          <div className="p-4 bg-gray-50 rounded-lg">
            <UnifiedFileUpload
              projectId={projectId}
              sectionName={sectionName}
              workspaceId={workspace?.companyId || ''}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              acceptedTypes={acceptString}
            />
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