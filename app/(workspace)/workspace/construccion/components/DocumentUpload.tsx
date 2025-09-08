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
import { useDirectFileUpload } from '@/lib/hooks/useDirectFileUpload'
import { generateUniqueFilePath } from '@/lib/utils/file-utils'

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
  const [logs, setLogs] = useState<string[]>([])
  
  const workspace = useWorkspace()
  
  const { 
    uploadFile, 
    isUploading: uploading, 
    progress
  } = useDirectFileUpload()

  // Función para agregar logs de debug
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DocumentUpload] ${message}`);
  };

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

        {/* Formulario de subida */}
        {showUploadForm && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept={acceptString}
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    try {
                      // Resetear errores previos
                      setError(null);
                      setLogs([]); // Limpiar logs anteriores
                      
                      addLog(`🚀 Iniciando upload de archivo: ${file.name} (${formatFileSize(file.size)})`);
                      addLog(`📁 Proyecto ID: ${projectId}`);
                      addLog(`📂 Sección: ${sectionName}`);
                      addLog(`🏢 Company ID: ${workspace?.companyId}`);
                      
                      // Subir archivo usando useDirectFileUpload
                      addLog('📤 Subiendo archivo a Supabase Storage...');
                      
                      // Generar ruta única usando la misma lógica que test-prefactibilidad
                      const filePath = generateUniqueFilePath({
                        companyId: workspace?.companyId || 'unknown',
                        projectId,
                        section: sectionName,
                        fileName: file.name
                      });
                      
                      addLog(`📁 Ruta generada: ${filePath}`);
                      
                      const uploadResult = await uploadFile({
                        file,
                        bucket: 'construction-documents',
                        path: filePath
                      });
                      
                      if (!uploadResult.success) {
                        throw new Error(uploadResult.error || 'Error en la subida');
                      }
                      
                      addLog(`✅ Archivo subido exitosamente`);
                      addLog(`🪣 Bucket: construction-documents`);
                      addLog(`📍 Path: ${filePath}`);
                      addLog(`🔗 Public URL: ${uploadResult.publicUrl ? 'Generada' : 'NO GENERADA'}`);
                      
                      if (uploadResult.publicUrl) {
                        addLog(`📏 URL Length: ${uploadResult.publicUrl.length}`);
                        addLog(`🔍 URL: ${uploadResult.publicUrl}`);
                      }
                      
                      // Verificar que tenemos los datos necesarios
                      if (!uploadResult.publicUrl) {
                        addLog('❌ ERROR: No se obtuvo URL pública del archivo subido');
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
                      
                      addLog('📋 Datos preparados para API:');
                      addLog(`  - Project ID: ${requestData.projectId ? '✅' : '❌'}`);
                      addLog(`  - Section Name: ${requestData.sectionName ? '✅' : '❌'}`);
                      addLog(`  - File Name: ${requestData.fileName ? '✅' : '❌'}`);
                      addLog(`  - File URL: ${requestData.fileUrl ? '✅' : '❌'}`);
                      
                      // Guardar metadatos en la base de datos
                      addLog('🌐 Enviando datos a API...');
                      const response = await fetch('/api/workspace/construction/documents', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestData)
                      });
                      
                      addLog(`📊 Respuesta API: ${response.status} ${response.statusText}`);
                      
                      if (!response.ok) {
                        const errorData = await response.json();
                        addLog(`❌ Error de API: ${JSON.stringify(errorData)}`);
                        throw new Error(errorData.error || 'Error al guardar el documento');
                      }
                      
                      const document = await response.json();
                      addLog(`✅ Documento creado exitosamente: ${document.id}`);
                      addLog(`📄 Nombre: ${document.fileName}`);
                      addLog(`🔗 URL: ${document.fileUrl}`);
                      handleUploadSuccess(document);
                      
                    } catch (error: any) {
                      addLog(`❌ ERROR FINAL: ${error.message}`);
                      console.error('Error creating document:', error);
                      setError('Error al crear el documento: ' + error.message);
                    } finally {
                      e.currentTarget.value = '';
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                
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
        
        {/* Logs de depuración - SIEMPRE VISIBLE */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Logs de Depuración ({logs.length})
          </h4>
          <div className="space-y-1 max-h-60 overflow-y-auto min-h-[100px] bg-white rounded border p-2">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} className="text-xs font-mono text-gray-700 p-1 border-b border-gray-100 last:border-b-0">
                  {log}
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-500 italic text-center py-4">
                No hay logs aún. Los logs aparecerán aquí cuando subas un archivo.
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLogs([])}
              className="text-xs"
              disabled={logs.length === 0}
            >
              Limpiar Logs
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const logText = logs.join('\n');
                navigator.clipboard.writeText(logText);
                addLog('📋 Logs copiados al portapapeles');
              }}
              className="text-xs"
              disabled={logs.length === 0}
            >
              Copiar Logs
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addLog('🧪 Log de prueba generado')}
              className="text-xs"
            >
              Probar Logs
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}