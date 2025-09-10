'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { 
  File, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Trash2,
  Plus,
  AlertCircle,
  Upload,
  CheckCircle 
} from 'lucide-react'
import { 
  getProjectDocuments, 
  deleteProjectDocument,
  formatFileSize,
  ALLOWED_FILE_TYPES,
  type ProjectDocument
} from '@/lib/storage'
import { useWorkspace } from '@/components/workspace-context'
import { useDirectFileUpload } from '@/lib/hooks/useDirectFileUpload'
import { generateUniqueFilePath } from '@/lib/utils/file-utils'

interface DocumentUploadProps {
  projectId: string
  sectionName: string
  onDocumentUploaded?: (document: ProjectDocument) => void
  onDocumentDeleted?: (documentId: string) => void
  // Nuevas props para unificación
  showNoDocumentationCheckbox?: boolean
  noDocumentationLabel?: string
  noDocumentationRequired?: boolean
  onNoDocumentationChange?: (checked: boolean) => void
  acceptedFileTypes?: string[]
  maxFileSize?: number
  isRequired?: boolean
  showCompletedState?: boolean
  isCompleted?: boolean
  completedMessage?: string
  allowMultipleFiles?: boolean
  customValidation?: (file: File) => string | null
  showProgress?: boolean
  compactMode?: boolean
}

export default function DocumentUpload({ 
  projectId, 
  sectionName, 
  onDocumentUploaded,
  onDocumentDeleted,
  // Nuevas props con valores por defecto
  showNoDocumentationCheckbox = false,
  noDocumentationLabel = "No requiere documentación",
  noDocumentationRequired = false,
  onNoDocumentationChange,
  acceptedFileTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maxFileSize = 100 * 1024 * 1024, // 100MB por defecto
  isRequired = false,
  showCompletedState = false,
  isCompleted = false,
  completedMessage = "Completado",
  allowMultipleFiles = true,
  customValidation,
  showProgress = true,
  compactMode = false
}: DocumentUploadProps) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [noDocsRequired, setNoDocsRequired] = useState(noDocumentationRequired)
  
  const workspace = useWorkspace()
  
  // Debug: Log workspace data
  useEffect(() => {
    console.log('[DocumentUpload] Workspace context:', {
      workspace,
      companyId: workspace?.companyId,
      companyName: workspace?.companyName,
      isLoading: workspace?.isLoading
    });
  }, [workspace]);
  
  const { 
    uploadFile, 
    isUploading: uploading, 
    progress
  } = useDirectFileUpload()



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

  // Tipos de archivo permitidos (usar los personalizados o los por defecto)
  const allowedTypes = acceptedFileTypes
  
  // Manejar cambio del checkbox "No requiere documentación"
  const handleNoDocsChange = (checked: boolean) => {
    setNoDocsRequired(checked)
    if (onNoDocumentationChange) {
      onNoDocumentationChange(checked)
    }
  }
  // Mapear tipos MIME específicos a extensiones de archivo para el atributo accept
  const MIME_TO_EXT: Record<string, string> = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
  }
  const acceptString = allowedTypes.map(type => 
    type.endsWith('/*') ? type : (MIME_TO_EXT[type] || `.${type.split('/')[1]}`)
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
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">{sectionName}</h4>
          <Button
            onClick={() => setShowUploadForm(!showUploadForm)}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            {showUploadForm ? 'Cancelar' : 'Subir Documento'}
          </Button>
        </div>
        
        {/* Checkbox "No requiere documentación" */}
        {showNoDocumentationCheckbox && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`no-docs-${sectionName.replace(/\s+/g, '-').toLowerCase()}`}
              checked={noDocsRequired}
              onChange={(e) => handleNoDocsChange(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={`no-docs-${sectionName.replace(/\s+/g, '-').toLowerCase()}`} className="text-xs text-muted-foreground">
              {noDocumentationLabel}
            </label>
          </div>
        )}
        
        {/* Estado completado */}
        {showCompletedState && isCompleted && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600">{completedMessage}</span>
            </div>
            <div className="text-xs text-blue-600">📄 Certificado disponible</div>
          </div>
        )}
        {/* Mostrar errores */}
        {error && (
          <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setError(null)
              }}
              className="text-red-600 hover:text-red-700"
            >
              ✕
            </Button>
          </div>
        )}

        {/* Área de carga de archivos - Solo mostrar si no está marcado "No requiere documentación" */}
        {!noDocsRequired ? (
          <>
            {!showUploadForm ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  Arrastra archivos aquí o haz clic para seleccionar
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Sube documentos relacionados con {sectionName.toLowerCase()}
                </p>
                <Button
                  onClick={() => setShowUploadForm(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Documento
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept={acceptString}
                      disabled={uploading}
                      className="hidden"
                      id={`document-upload-${sectionName.replace(/\s+/g, '-').toLowerCase()}`}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        try {
                          // Resetear errores previos
                          setError(null);
                          
                          // Validación personalizada si está definida
                          if (customValidation) {
                            const validationError = customValidation(file);
                            if (validationError) {
                              throw new Error(validationError);
                            }
                          }
                          
                          // Subir archivo usando useDirectFileUpload
                          
                          // Generar ruta única usando la misma lógica que test-prefactibilidad
                          // Verificar que tenemos el companyId del workspace
                          if (!workspace.companyId) {
                            console.error('[DocumentUpload] Missing companyId:', {
                              workspace,
                              companyId: workspace.companyId,
                              isLoading: workspace.isLoading
                            });
                            throw new Error('No se pudo obtener el ID de la empresa. Por favor, recarga la página.');
                          }
                          
                          const filePath = generateUniqueFilePath({
                            companyId: workspace?.companyId,
                            projectId,
                            section: sectionName,
                            fileName: file.name
                          });
                          

                          
                          const uploadResult = await uploadFile({
                            file,
                            bucket: 'construction-documents',
                            path: filePath
                          });
                          
                          if (!uploadResult.success) {
                            throw new Error(uploadResult.error || 'Error en la subida');
                          }
                          

                          
                          // Verificar que tenemos los datos necesarios
                          if (!uploadResult.publicUrl) {
                            throw new Error('No se obtuvo URL pública del archivo subido');
                          }
                          
                          const requestData = {
                            projectId,
                            sectionName,
                            fileName: filePath.split('/').pop() || file.name,
                            originalFileName: file.name,
                            fileUrl: uploadResult.publicUrl,
                            fileSize: file.size,
                            mimeType: file.type,
                            description: `Documento de ${sectionName}`
                          };
                          
                          // Guardar metadatos en la base de datos
                          const response = await fetch('/api/workspace/construction/documents', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(requestData)
                          });
                          
                          if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Error al guardar el documento');
                          }
                          
                          const document = await response.json();
                          handleUploadSuccess(document);
                          
                        } catch (error: any) {
                          console.error('Error creating document:', error);
                          setError('Error al crear el documento: ' + error.message);
                        } finally {
                          // Verificar que el elemento aún existe antes de limpiar el valor
                          if (e.currentTarget) {
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      disabled={uploading}
                      onClick={() => document.getElementById(`document-upload-${sectionName.replace(/\s+/g, '-').toLowerCase()}`)?.click()}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      {uploading ? 'Subiendo...' : 'Cargar Documento'}
                    </Button>
                    
                    {/* Información de progreso si está subiendo */}
                    {uploading && (
                      <div className="text-sm text-blue-600">
                        Subiendo archivo... {Math.round(progress)}%
                      </div>
                    )}
                  </div>
                  
                  {/* Barra de progreso */}
                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-600">Subiendo archivo...</span>
                        <span className="text-blue-600">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Información sobre tipos de archivo permitidos */}
                  {!uploading && (
                    <div className="text-xs text-gray-500">
                      <p>Tipos de archivo permitidos: {allowedTypes.join(', ')}</p>
                      <p>Tamaño máximo: 100MB</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground">
              {noDocumentationLabel}
            </div>
          </div>
        )}

        {/* Lista de documentos existentes */}
        {!noDocsRequired && documents.length > 0 && (
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-700">Documentos cargados:</h5>
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
        )}
      </div>
    </Card>
  )
}