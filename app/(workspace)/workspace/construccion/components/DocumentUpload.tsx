'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from '@/components/workspace-context'
// import { getProjectDocuments } from '@/lib/construction' // no usado
import { deleteProjectDocument } from '@/lib/storage'
import { useDirectFileUpload } from '@/lib/hooks/useDirectFileUpload'
import DocumentSection from './DocumentSection'

// Tipo local usado por este componente
type FrontendProjectDocument = {
  id: string
  projectId: string
  fileName: string
  fileSize: number
  fileType: string
  section: string
  uploadedAt: string
  uploadedBy: string
  fileUrl: string
  status: 'uploaded' | 'processing' | 'error'
}

// Documentos a mostrar (mismo shape que espera DocumentSection)
type DisplayDocument = {
  id: string
  name: string
  size: number
  type: string
  uploadDate: string
  url: string
}

interface DocumentUploadProps {
  projectId: string
  sectionName: string
  // Props simplificadas para el nuevo diseño
  onDocumentUploaded?: (document: FrontendProjectDocument) => void
  onDocumentDeleted?: (documentId: string) => void
  acceptedFileTypes?: string[]
  maxFileSize?: number
  // Nuevo: expandido inicial y documentos externos precargados
  isInitiallyExpanded?: boolean
  externalDocuments?: DisplayDocument[]
  // Checkbox "No requiere documentación"
  showNoDocumentationCheckbox?: boolean
  noDocumentationLabel?: string
  noDocumentationRequired?: boolean
  onNoDocumentationChange?: (checked: boolean) => void
  // Campo fecha de vencimiento
  showExpirationDate?: boolean
  expirationDateLabel?: string
  expirationDate?: string
  onExpirationDateChange?: (date: string) => void
  onSaveExpirationDate?: (sectionName: string, date: string) => void
  onSetOneYearExpiration?: (sectionName: string) => void
  isSavingDate?: boolean
  savedExpirationDate?: string
}

export default function DocumentUpload({ 
  projectId,
  sectionName,
  onDocumentUploaded,
  onDocumentDeleted,
  acceptedFileTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maxFileSize = 100 * 1024 * 1024, // 100MB por defecto
  isInitiallyExpanded = false,
  externalDocuments = [],
  showNoDocumentationCheckbox = false,
  noDocumentationLabel = "No requiere documentación",
  noDocumentationRequired = false,
  onNoDocumentationChange,
  showExpirationDate = false,
  expirationDateLabel = "Fecha de vencimiento",
  expirationDate = "",
  onExpirationDateChange,
  onSaveExpirationDate,
  onSetOneYearExpiration,
  isSavingDate = false,
  savedExpirationDate,
}: DocumentUploadProps) {
  const [documents, setDocuments] = useState<FrontendProjectDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded)
  const [uploadingSection, setUploadingSection] = useState<string | null>(null)
  
  const workspace = useWorkspace()
  const directFileUpload = useDirectFileUpload()
  const { uploadFile, isUploading, progress } = directFileUpload

  // Cargar documentos al montar el componente
  useEffect(() => {
    loadDocuments()
  }, [projectId, sectionName])

  // Función para guardar fecha de vencimiento
  const saveExpirationDate = async (sectionName: string, date: string) => {
    try {
      const response = await fetch('/api/workspace/construction/expiration-dates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          section_name: sectionName,
          expiration_date: date
        }),
      })

      if (!response.ok) {
        throw new Error('Error al guardar fecha de vencimiento')
      }

      console.log(`Fecha de vencimiento guardada para ${sectionName}: ${date}`)
    } catch (error) {
      console.error('Error saving expiration date:', error)
      throw error
    }
  }

  const loadDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/workspace/construction/documents?projectId=${projectId}`)
      
      if (!response.ok) {
        // Si el endpoint aún no existe, no bloquear el render del uploader
        console.warn('GET /api/workspace/construction/documents todavía no implementado. Continuando sin documentos...')
        setDocuments([])
        return
      }
      
      const data = await response.json()
      
      // Debug: Log de todos los documentos recibidos
      console.log(`🔍 [DocumentUpload] Documentos recibidos para proyecto ${projectId}:`, data)
      console.log(`🔍 [DocumentUpload] Filtrando por sectionName: "${sectionName}"`)
      
      // Filtrar documentos por sección
      const filteredDocuments = data.filter((doc: any) => {
        const matches = doc.section_name === sectionName
        console.log(`🔍 [DocumentUpload] Documento "${doc.original_filename}" - section_name: "${doc.section_name}" - matches "${sectionName}": ${matches}`)
        return matches
      })
      
      console.log(`🔍 [DocumentUpload] Documentos filtrados para "${sectionName}":`, filteredDocuments)
      
      // Adaptar al shape que espera el frontend
      const adaptedDocuments: FrontendProjectDocument[] = filteredDocuments.map((doc: any) => ({
        id: doc.id,
        projectId: doc.project_id,
        fileName: doc.filename || doc.original_filename,
        fileSize: doc.file_size,
        fileType: doc.mime_type,
        section: doc.section_name,
        uploadedAt: doc.created_at,
        uploadedBy: doc.uploaded_by,
        fileUrl: doc.file_url,
        status: 'uploaded' as const
      }))
      
      setDocuments(adaptedDocuments)
    } catch (error) {
      console.error('Error loading documents:', error)
      setError('Error al cargar los documentos')
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentUploaded = (document: FrontendProjectDocument) => {
    setDocuments(prev => [...prev, document])
    onDocumentUploaded?.(document)
  }

  const handleDocumentDeleted = async (documentId: string) => {
    try {
      if (!workspace?.companyId) {
        throw new Error('No hay workspace seleccionado')
      }

      await deleteProjectDocument(documentId)
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      onDocumentDeleted?.(documentId)
      
      // Disparar evento para recargar fechas de vencimiento
      window.dispatchEvent(new CustomEvent('reloadDeadlineDates'))
    } catch (err) {
      console.error('Error eliminando documento:', err)
      setError(err instanceof Error ? err.message : 'Error eliminando documento')
    }
  }

  // Función para manejar la subida de archivos
  const handleFileUpload = async (files: FileList, targetSection: string) => {
    if (!files || files.length === 0) return

    // Validar que directFileUpload esté disponible
    if (!directFileUpload || !uploadFile) {
      setError('Sistema de subida no disponible')
      return
    }

    // Validar workspace
    if (!workspace?.companyId) {
      setError('No hay workspace seleccionado')
      return
    }

    setUploadingSection(targetSection)
    setError(null)
    
    try {
      for (const file of Array.from(files)) {
        // Validar tipo de archivo
        if (!acceptedFileTypes.includes(file.type) && !acceptedFileTypes.includes('image/*') && !acceptedFileTypes.includes('*/*')) {
          throw new Error(`Tipo de archivo no permitido: ${file.type}`)
        }

        // Validar tamaño
        if (file.size > maxFileSize) {
          throw new Error(`Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
        }

        // Validar que el archivo no esté vacío
        if (file.size === 0) {
          throw new Error('El archivo está vacío')
        }

        // Sanitizar nombre del archivo
        const sanitizedFileName = file.name
          .replace(/\s+/g, '_')  // Reemplazar espacios con guiones bajos
          .replace(/[^a-zA-Z0-9._-]/g, '')  // Solo permitir caracteres alfanuméricos, puntos, guiones bajos y guiones
          .replace(/_{2,}/g, '_')  // Reemplazar múltiples guiones bajos consecutivos con uno solo
          .toLowerCase()  // Convertir a minúsculas para consistencia
        
        // Generar un ID único para cada subida (incluso del mismo archivo)
        const uniqueId = crypto.randomUUID()
        const timestamp = Date.now()
        
        // Sanitizar nombre de sección para usar como carpeta
        const sanitizedSectionName = targetSection
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9._-]/g, '')
          .toLowerCase()
        
        // Crear estructura de carpetas más robusta: companyId/projectId/sectionName/uniqueId-timestamp-fileName
        const path = `${workspace.companyId}/${projectId}/${sanitizedSectionName}/${uniqueId}-${timestamp}-${sanitizedFileName}`
        
        // Validar parámetros requeridos para directFileUpload
        const uploadParams = {
          bucket: 'construction-documents',
          path,
          file
        }

        // Verificar que todos los parámetros estén presentes
        if (!uploadParams.bucket || !uploadParams.path || !uploadParams.file) {
          throw new Error('Faltan parámetros requeridos para la subida')
        }
        
        // Subir archivo usando directFileUpload
        const uploadResult = await uploadFile(uploadParams)

        if (!uploadResult || !uploadResult.success) {
          throw new Error(uploadResult?.error || 'Error al subir el archivo')
        }

        // Guardar información del documento en la base de datos
        const documentResponse = await fetch('/api/workspace/construction/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileUrl: uploadResult.publicUrl,
            fileName: path, // Usar el path completo como fileName
            originalFileName: file.name,
            projectId,
            sectionName: targetSection,
            description: `Documento subido para ${targetSection}`,
            fileSize: file.size,
            mimeType: file.type
          }),
        })

        if (!documentResponse.ok) {
          const errorData = await documentResponse.json()
          throw new Error(errorData.error || 'Error al guardar el documento en la base de datos')
        }

        const savedDocument = await documentResponse.json()

        // Crear documento en el formato local del frontend usando los datos guardados
        const newDocument: FrontendProjectDocument = {
          id: savedDocument.id,
          projectId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          section: targetSection,
          uploadedAt: savedDocument.created_at || new Date().toISOString(),
          uploadedBy: 'current-user', // TODO: obtener del contexto de usuario
          fileUrl: uploadResult.publicUrl || '',
          status: 'uploaded'
        }

        // Actualizar estado local
        setDocuments(prev => [...prev, newDocument])
        
        // Notificar al componente padre
        onDocumentUploaded?.(newDocument)
        
        // Disparar evento para recargar fechas de vencimiento
        window.dispatchEvent(new CustomEvent('reloadDeadlineDates'))

        // REMOVIDO: Ya no guardamos automáticamente la fecha de vencimiento
        // El usuario debe usar el botón "Guardar fecha" manualmente
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      setError(error instanceof Error ? error.message : 'Error al subir archivo')
    } finally {
      setUploadingSection(null)
    }
  }

  // Adaptar documentos al shape que espera DocumentSection
  const displayDocumentsFromState: DisplayDocument[] = documents.map(d => ({
    id: d.id,
    name: d.fileName,
    size: d.fileSize,
    type: d.fileType,
    uploadDate: d.uploadedAt,
    url: d.fileUrl
  }))

  // Mezclar documentos externos (precargados) con los subidos en esta sesión, evitando duplicados por id
  const finalDisplayDocuments: DisplayDocument[] = (() => {
    const byId = new Map<string, DisplayDocument>()
    ;[...externalDocuments, ...displayDocumentsFromState].forEach(doc => {
      byId.set(doc.id, doc)
    })
    return Array.from(byId.values())
  })()

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      )}
      
      <DocumentSection
        title={sectionName}
        sectionName={sectionName}
        projectId={projectId}
        documents={finalDisplayDocuments}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
        onFileUpload={handleFileUpload}
        onDocumentDelete={handleDocumentDeleted}
        isUploading={uploadingSection === sectionName && isUploading}
        uploadProgress={uploadingSection === sectionName ? progress : 0}
        acceptedFileTypes={acceptedFileTypes.map(type => {
          // Convertir MIME types a extensiones para el input file
          if (type === 'application/pdf') return '.pdf'
          if (type === 'image/jpeg' || type === 'image/jpg') return '.jpg,.jpeg'
          if (type === 'image/png') return '.png'
          if (type === 'application/msword') return '.doc'
          if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '.docx'
          if (type === 'application/dwg') return '.dwg'
          return type
        })}
        showNoDocumentationCheckbox={showNoDocumentationCheckbox}
        noDocumentationLabel={noDocumentationLabel}
        noDocumentationRequired={noDocumentationRequired}
        onNoDocumentationChange={onNoDocumentationChange}
        showExpirationDate={showExpirationDate}
        expirationDateLabel={expirationDateLabel}
        uploadDate={expirationDate}
        onUploadDateChange={onExpirationDateChange}
        onSaveUploadDate={onSaveExpirationDate}
        onSetOneYearExpiration={onSetOneYearExpiration}
        isSavingDate={isSavingDate}
        savedUploadDate={savedExpirationDate}
      />
    </div>
  )
}