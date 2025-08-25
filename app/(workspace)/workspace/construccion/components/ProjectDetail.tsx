'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  Edit, 
  MapPin, 
  Building, 
  User, 
  Calendar, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Phone,
  Mail,
  Download,
  Upload,
  Save,
  Eye,
  Trash2,
  Camera,
  Image as ImageIcon,
  Plus,
  X
} from 'lucide-react'
import Image from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Project, mockProjectStages, ProjectProfessional } from '@/lib/construction'
import { uploadProjectImage } from '@/lib/storage'
import { useDirectFileUpload } from '@/lib/hooks/useDirectFileUpload'
import { useWorkspace } from '@/components/workspace-context'
import DomainReportSection from './DomainReportSection'
import GovernmentTaxesSection from './GovernmentTaxesSection'
import ExpedientesManager from '@/components/ExpedientesManager'

interface ProjectDetailProps {
  project: Project
  onBack: () => void
  onStageChange: (projectId: string, newStage: string) => void
  onProjectUpdate?: (updatedProject: Project) => void
  onDeleteProject?: (projectId: string) => void
}

// Verificaciones actualizadas según nuevas etapas
const verificationRequests = [
  { name: 'Consulta DGIUR', required: true },
  { name: 'Permiso de Demolición', required: false },
  { name: 'Registro etapa de proyecto - Informe', required: true },
  { name: 'Registro etapa de proyecto - Plano', required: true },
  { name: 'Permiso de obra', required: true },
  { name: 'Demolición', required: false },
  { name: 'Excavación', required: false },
  { name: 'AVO 1', required: true },
  { name: 'AVO 2', required: true },
  { name: 'AVO 3', required: true },
  { name: 'Conforme de obra', required: true },
  { name: 'MH-SUBDIVISION', required: true }
]



// Etapas reorganizadas según nueva estructura
const projectPhases = [
  {
    name: 'Prefactibilidad del proyecto',
    stages: ['Prefactibilidad del proyecto']
  },
  {
    name: 'En Gestoria',
    stages: ['Consulta DGIUR', 'Permiso de Demolición', 'Registro etapa de proyecto - Informe', 'Registro etapa de proyecto - Plano', 'Permiso de obra']
  },
  {
    name: 'En ejecución de obra',
    stages: ['Demolición', 'Excavación', 'AVO 1', 'AVO 2', 'AVO 3']
  },
  {
    name: 'Finalización',
    stages: ['Conforme de obra', 'MH-SUBDIVISION']
  }
]

// Tipo para documentos del proyecto
interface ProjectDocument {
  id: string
  name: string
  section: string
  uploadDate: string
  size: string
  type: string
  url?: string
  isSpecial?: boolean
  validUntil?: string
  isValid?: boolean
}

// Mock documents para mostrar en la vista unificada
const mockDocuments: ProjectDocument[] = [
  {
    id: '1',
    name: 'Plano arquitectónico principal.pdf',
    section: 'Planos de Proyecto e Instalaciones',
    uploadDate: '2024-01-15',
    size: '2.5 MB',
    type: 'pdf'
  },
  {
    id: '2',
    name: 'Permiso municipal.pdf',
    section: 'Documentación Municipal y Gestoría',
    uploadDate: '2024-01-20',
    size: '1.2 MB',
    type: 'pdf'
  },
  {
    id: '3',
    name: 'Conexión eléctrica.pdf',
    section: 'Servicios Públicos',
    uploadDate: '2024-02-01',
    size: '800 KB',
    type: 'pdf'
  },
  {
    id: '4',
    name: 'Certificado ART.pdf',
    section: 'Seguros y Documentación Administrativa',
    uploadDate: '2024-02-10',
    size: '1.1 MB',
    type: 'pdf'
  }
]

export default function ProjectDetail({ project, onBack, onStageChange, onProjectUpdate, onDeleteProject }: ProjectDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedProject, setEditedProject] = useState(project)
  const [documents, setDocuments] = useState<ProjectDocument[]>(mockDocuments)
  const [uploadingTo, setUploadingTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tableExists, setTableExists] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [currentUploadSection, setCurrentUploadSection] = useState<string | null>(null)
  
  // Hook para obtener el workspace actual
  const { companyId } = useWorkspace()
  
  // Hook para manejar subidas de imágenes con Supabase Storage
  const { upload, uploadProgress: imageUploadProgress, isUploading: isUploadingImage } = useFileUpload()
  
  const handleImageUploadSuccess = async (fileUrl: string, fileName: string) => {
      try {
        // Actualizar proyecto con la nueva imagen
        const response = await fetch('/api/workspace/construction/projects', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: project.id,
            cover_image_url: fileUrl
          }),
        })

        if (!response.ok) {
          throw new Error('Error al actualizar el proyecto')
        }

        const data = await response.json()
        const updatedProject = data.project
        
        // Actualizar el proyecto local
        setEditedProject(updatedProject)
        
        // Notificar al componente padre si existe la función
        if (onProjectUpdate) {
          onProjectUpdate(updatedProject)
        }
      } catch (error) {
        console.error('Error updating project with image URL:', error)
        alert('Error al actualizar el proyecto con la imagen. Por favor, inténtalo de nuevo.')
      }
  }
  
  const handleImageUploadError = (error: string) => {
    alert(`Error al subir la imagen: ${error}`)
  }
  
  // Sincronizar estado del hook con estado local
  useEffect(() => {
    setUploadingImage(isUploadingImage)
  }, [isUploadingImage])
  const [activeTab, setActiveTab] = useState('documentos')
  const [dgiurNoDocsRequired, setDgiurNoDocsRequired] = useState(false)
  const [demolicionNoDocsRequired, setDemolicionNoDocsRequired] = useState(false)
  const [expedientes, setExpedientes] = useState(project.expedientes || [])

  useEffect(() => {
    setEditedProject(project)
    setExpedientes(project.expedientes || [])
    loadProjectDocuments()
  }, [project])

  const handleExpedientesChange = (newExpedientes: any[]) => {
    setExpedientes(newExpedientes)
    // Actualizar el proyecto con los nuevos expedientes
    const updatedProject = { ...project, expedientes: newExpedientes }
    if (onProjectUpdate) {
      onProjectUpdate(updatedProject)
    }
  }

  const handleProjectReload = async () => {
    try {
      // Importar getProjectById dinámicamente para evitar problemas de importación
      const { getProjectById } = await import('@/lib/construction')
      const updatedProject = await getProjectById(project.id)
      if (updatedProject) {
        setEditedProject(updatedProject)
        setExpedientes(updatedProject.expedientes || [])
        if (onProjectUpdate) {
          onProjectUpdate(updatedProject)
        }
      }
    } catch (error) {
      console.error('Error reloading project:', error instanceof Error ? error.message : String(error))
      // Silenciar el error para evitar interrumpir la experiencia del usuario
    }
  }

  const loadProjectDocuments = async () => {
    try {
      setLoading(true)
      let allDocuments: any[] = []
      
      const response = await fetch(`/api/workspace/construction/documents?projectId=${project.id}`)
      
      if (response.ok) {
        const apiDocuments = await response.json()
        setTableExists(true)
        // Convertir formato API a formato del componente
        allDocuments = apiDocuments.map((doc: any): ProjectDocument => ({
          id: doc.id,
          name: doc.original_filename,
          section: doc.section_name,
          uploadDate: new Date(doc.created_at).toISOString().split('T')[0],
          size: `${(doc.file_size / 1024 / 1024).toFixed(1)} MB`,
          type: doc.mime_type.includes('pdf') ? 'pdf' : 'image',
          url: doc.file_url
        }))
      } else {
        const errorData = await response.json()
        if (errorData.error && errorData.error.includes('project_documents')) {
          setTableExists(false)
        } else if (errorData.error && errorData.error.includes('estructura correcta')) {
          setTableExists(false)
        }
        // Usar documentos mock en caso de error
        allDocuments = [...mockDocuments]
      }
      
      // Agregar informe de dominio si existe
      if (project.domain_report_file_url) {
        const domainReportDoc: ProjectDocument = {
          id: 'domain-report',
          name: 'Informe de Dominio.pdf',
          section: 'Informe de Dominio',
          uploadDate: project.domain_report_upload_date ? 
            new Date(project.domain_report_upload_date).toISOString().split('T')[0] : 
            'Fecha no disponible',
          size: 'N/A',
          type: 'pdf',
          url: project.domain_report_file_url,
          isSpecial: true,
          validUntil: project.domain_report_expiry_date || undefined,
          isValid: project.domain_report_is_valid || undefined
        }
        allDocuments.unshift(domainReportDoc)
      }
      
      // Establecer documentos directamente
      setDocuments(allDocuments)
    } catch (error) {
      console.error('Error loading documents:', error)
      // Mantener documentos mock en caso de error
      setDocuments(mockDocuments)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const { id, ...projectData } = editedProject
      const response = await fetch('/api/workspace/construction/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: project.id,
          ...projectData
        }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el proyecto')
      }

      const data = await response.json()
      const updatedProject = data.project
      
      // Actualizar el proyecto local
      setEditedProject(updatedProject)
      
      // Notificar al componente padre si existe la función
      if (onProjectUpdate) {
        onProjectUpdate(updatedProject)
      }
      
      setIsEditing(false)
      
    } catch (error) {
      console.error('Error saving project:', error)
      alert('Error al guardar los cambios. Por favor, inténtalo de nuevo.')
    }
  }

  const handleImageUpload = async (file: File) => {
    try {
      // Subir imagen usando el nuevo sistema de upload directo a Supabase Storage
      const result = await upload({
        file,
        bucket: 'company-logos',
        workspaceId: companyId || 'default',
        folder: 'project-covers'
      })
      
      // Manejar éxito de la subida
      if (result.publicUrl) {
        await handleImageUploadSuccess(result.publicUrl, file.name)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      handleImageUploadError(error instanceof Error ? error.message : 'Error desconocido')
    }
  }

  // Hook adicional para manejar subidas directas de documentos con URLs firmadas
  const { uploadFile: uploadDocument, isUploading: isUploadingDocument } = useDirectFileUpload()
  
  const handleDocumentUploadSuccess = async (fileUrl: string, fileName: string) => {
    try {
      // Crear documento en la base de datos usando la URL de Supabase Storage
      const response = await fetch('/api/workspace/construction/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl,
          fileName,
          projectId: project.id,
          sectionName: currentUploadSection,
          description: `Documento de ${currentUploadSection}`
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || `Error ${response.status}`)
      }

      // Recargar documentos del proyecto para mantener sincronización
      await loadProjectDocuments()
      
      // Mostrar mensaje de éxito
      alert(`Documento "${fileName}" cargado exitosamente`)
    } catch (error) {
      console.error('Error creating document:', error)
      alert(`Error al crear el documento: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setUploading(false)
      setCurrentUploadSection(null)
    }
  }
  
  const handleDocumentUploadError = (error: string) => {
    alert(`Error al subir el archivo: ${error}`)
    setUploading(false)
    setCurrentUploadSection(null)
  }

  const handleFileUpload = async (file: File, section: string) => {
    try {
      setUploading(true)
      setCurrentUploadSection(section)
      setUploadingTo(null)
      
      // Generar ruta para el archivo
      const timestamp = new Date().toISOString().split('T')[0]
      const sanitizedSectionName = section.toLowerCase().replace(/\s+/g, '-')
      const path = `${companyId || 'default'}/projects/${project.id}/${sanitizedSectionName}/${timestamp}/${file.name}`
      
      // Subir documento usando subida directa con URL firmada
      const result = await uploadDocument({
        bucket: 'construction-documents',
        path,
        file
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Error al subir el archivo')
      }
      
      // Manejar éxito de la subida
      if (result.publicUrl) {
        await handleDocumentUploadSuccess(result.publicUrl, file.name)
      }
    } catch (error) {
      console.error('Upload error:', error)
      handleDocumentUploadError(error instanceof Error ? error.message : 'Error desconocido')
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este documento?')) {
      return
    }

    try {
      const response = await fetch(`/api/workspace/construction/documents?id=${documentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar el documento')
      }

      const data = await response.json()
      
      // Actualizar la lista de documentos
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      
      // Recargar documentos del proyecto para mantener sincronización
      await loadProjectDocuments()
      
      alert(`✅ ${data.message}`)
      
    } catch (error: any) {
      console.error('Error deleting document:', error)
      alert(`❌ Error al eliminar el documento\n\nDetalles: ${error.message}`)
    }
  }

  const handleViewDocument = (document: any) => {
    if (document.url) {
      window.open(document.url, '_blank')
    } else {
      alert('URL del documento no disponible')
    }
  }

  const handleDownloadDocument = (document: any) => {
    if (document.url) {
      const link = window.document.createElement('a')
      link.href = document.url
      link.download = document.name
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
    } else {
      alert('URL del documento no disponible')
    }
  }

  const handleVerificationUpload = (verificationName: string, file: File) => {
    handleFileUpload(file, `Verificaciones - ${verificationName}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprobado':
      case 'Pagado':
      case 'Activo':
        return 'bg-green-500'
      case 'En trámite':
      case 'Pendiente':
        return 'bg-yellow-500'
      case 'Rechazado':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStageColor = (stage: string) => {
    const stageColors: Record<string, string> = {
      // Prefactibilidad
      'Prefactibilidad del proyecto': 'bg-purple-500',
      
      // En Gestoria
      'Consulta DGIUR': 'bg-yellow-500',
      'Registro etapa de proyecto': 'bg-yellow-600',
      'Permiso de obra': 'bg-yellow-700',
      
      // En ejecución de obra
      'Demolición': 'bg-red-500',
      'Excavación': 'bg-red-600',
      'AVO 1': 'bg-green-500',
      'AVO 2': 'bg-green-600',
      'AVO 3': 'bg-green-700',
      
      // Finalización
      'Conforme de obra': 'bg-emerald-600',
      'MH-SUBDIVISION': 'bg-emerald-700',
      
      // Compatibilidad temporal con etapas antiguas
      'Planificación': 'bg-gray-500',
      'Permisos': 'bg-yellow-500',
      'Finalización': 'bg-emerald-600'
    }
    return stageColors[stage] || 'bg-blue-500'
  }

  const getFileIcon = (type: string) => {
    if (type === 'pdf') return '📄'
    if (type === 'image') return '🖼️'
    return '📎'
  }

  // Función para verificar si hay documentos para una verificación específica
  const getVerificationDocuments = (verificationName: string) => {
    return documents.filter(doc => 
      doc.section.includes(`Verificaciones - ${verificationName}`)
    )
  }

  // Función para verificar si una verificación tiene certificado
  const hasVerificationCertificate = (verificationName: string) => {
    const docs = getVerificationDocuments(verificationName)
    return docs.length > 0
  }

  // Función para verificar si hay documentos específicos para Informe o Plano
  const hasSpecificDocument = (verificationName: string, documentType: string = '') => {
    // Para los nuevos nombres separados, buscar directamente por el nombre de verificación
    if (verificationName.includes('Registro etapa de proyecto -')) {
      const filteredDocs = documents.filter(doc => 
        doc.section.includes(`Verificaciones - ${verificationName}`)
      )
      return filteredDocs.length > 0
    }
    
    // Para compatibilidad con el código anterior
    const filteredDocs = documents.filter(doc => 
      doc.section.includes(`Verificaciones - ${verificationName} - ${documentType}`)
    )
    return filteredDocs.length > 0
  }

  // Funciones para manejar profesionales
  const handleProfesionalChange = (index: number, field: 'name' | 'role', value: string) => {
    setEditedProject(prev => {
      const newProfesionales = [...(prev.profesionales || [])]
      newProfesionales[index] = {
        ...newProfesionales[index],
        [field]: value
      }
      return {
        ...prev,
        profesionales: newProfesionales
      }
    })
  }

  const addProfesional = () => {
    setEditedProject(prev => ({
      ...prev,
      profesionales: [...(prev.profesionales || []), { name: '', role: 'Estructuralista' as const }]
    }))
  }

  const removeProfesional = (index: number) => {
    setEditedProject(prev => ({
      ...prev,
      profesionales: (prev.profesionales || []).filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto px-6 py-6 space-y-6">
        {/* Header mejorado */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Proyectos
        </Button>
              <Separator orientation="vertical" className="h-8" />
        <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-lg text-gray-600">{project.dgro_file_number}</p>
        </div>
      </div>

            <div className="flex items-center gap-3">
              <Badge className={`${getStageColor(project.current_stage || '')} text-white px-4 py-2 text-sm`}>
                {project.current_stage}
              </Badge>
              {isEditing ? (
                <>
                  <Button 
                    onClick={handleSave}
                    variant="default"
                    size="lg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsEditing(false)
                      setEditedProject(project) // Restaurar datos originales
                    }}
                    variant="outline"
                    size="lg"
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => setIsEditing(true)}
                  variant="default"
                  size="lg"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
              {onDeleteProject && (
                <Button 
                  onClick={() => onDeleteProject(project.id)}
                  variant="destructive"
                  size="lg"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Imagen de portada del proyecto - Ocupa todo el ancho */}
        <div className="w-full">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative h-80 bg-gray-100">
                {editedProject.cover_image_url ? (
                  <img
                    src={editedProject.cover_image_url}
                    alt={editedProject.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200">
                    <div className="text-center">
                      <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">Imagen del Proyecto</p>
                      <p className="text-gray-400 text-sm">No disponible</p>
                    </div>
                  </div>
                )}
                
                {/* Overlay con información del proyecto */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="font-bold text-2xl mb-2">{editedProject.name}</h3>
                  <p className="text-lg opacity-90 mb-1">{editedProject.address}</p>
                  {(editedProject.barrio || editedProject.ciudad) && (
                    <div className="flex items-center gap-2 text-sm opacity-75">
                      {editedProject.barrio && <span>{editedProject.barrio}</span>}
                      {editedProject.barrio && editedProject.ciudad && <span>•</span>}
                      {editedProject.ciudad && <span>{editedProject.ciudad}</span>}
                    </div>
                  )}
                </div>
                
                {/* Botón para editar imagen */}
                <div className="absolute top-6 right-6">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="project-image-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleImageUpload(file)
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/90 hover:bg-white text-gray-700 shadow-lg"
                    onClick={() => document.getElementById('project-image-upload')?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        {editedProject.cover_image_url ? 'Cambiar' : 'Agregar'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Layout principal mejorado - layout responsivo con mejor distribución */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Columna principal - Información del proyecto */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Información general */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Building className="h-5 w-5" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                      <div className="col-span-full">
                        <ExpedientesManager
                          projectId={project.id}
                          expedientes={expedientes}
                          onExpedientesChange={handleExpedientesChange}
                          onProjectReload={handleProjectReload}
                          readOnly={!isEditing}
                        />
                      </div>
                      
                <div>
                        <Label className="text-sm font-medium text-muted-foreground">Dirección</Label>
                        {isEditing ? (
                          <Input
                            value={editedProject.address || ''}
                            onChange={(e) => setEditedProject(prev => ({
                              ...prev,
                              address: e.target.value
                            }))}
                            className="mt-1"
                          />
                        ) : (
                          <p className="font-semibold">{project.address}</p>
                        )}
                </div>

                <div>
                        <Label className="text-sm font-medium text-muted-foreground">Barrio</Label>
                        {isEditing ? (
                          <Input
                            value={editedProject.barrio || ''}
                            onChange={(e) => setEditedProject(prev => ({
                              ...prev,
                              barrio: e.target.value
                            }))}
                            className="mt-1"
                            placeholder="Ej: Palermo"
                          />
                        ) : (
                          <p className="font-semibold">{project.barrio || 'No especificado'}</p>
                        )}
                </div>

                <div>
                        <Label className="text-sm font-medium text-muted-foreground">Ciudad</Label>
                        {isEditing ? (
                          <Input
                            value={editedProject.ciudad || ''}
                            onChange={(e) => setEditedProject(prev => ({
                              ...prev,
                              ciudad: e.target.value
                            }))}
                            className="mt-1"
                            placeholder="Ej: CABA"
                          />
                        ) : (
                          <p className="font-semibold">{project.ciudad || 'No especificado'}</p>
                        )}
                </div>
                      
                <div>
                        <Label className="text-sm font-medium text-muted-foreground">Superficie a construir</Label>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editedProject.surface || ''}
                            onChange={(e) => setEditedProject(prev => ({
                              ...prev,
                              surface: parseFloat(e.target.value) || 0
                            }))}
                            className="mt-1"
                          />
                        ) : (
                          <p className="font-semibold">{project.surface?.toLocaleString()} m²</p>
                        )}
                </div>

                <div>
                        <Label className="text-sm font-medium text-muted-foreground">Director de Obra</Label>
                        {isEditing ? (
                          <Input
                            value={editedProject.director_obra || editedProject.architect || ''}
                            onChange={(e) => setEditedProject(prev => ({
                              ...prev,
                              director_obra: e.target.value
                            }))}
                            className="mt-1"
                            placeholder="Nombre del director de obra"
                          />
                        ) : (
                          <p className="font-semibold">{project.director_obra || project.architect || 'No especificado'}</p>
                        )}
                </div>
                      
                <div>
                        <Label className="text-sm font-medium text-muted-foreground">Constructor</Label>
                        {isEditing ? (
                          <Input
                            value={editedProject.builder || ''}
                            onChange={(e) => setEditedProject(prev => ({
                              ...prev,
                              builder: e.target.value
                            }))}
                            className="mt-1"
                          />
                        ) : (
                          <p className="font-semibold">{project.builder}</p>
                        )}
                </div>
                </div>

                    <div className="space-y-4">
                <div>
                        <Label className="text-sm font-medium text-muted-foreground">Tipo de obra</Label>
                        {isEditing ? (
                          <Select
                            value={editedProject.project_type || ''}
                            onValueChange={(value) => setEditedProject(prev => ({
                              ...prev,
                              project_type: value
                            }))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Microobra">Microobra</SelectItem>
                              <SelectItem value="Obra Menor">Obra Menor</SelectItem>
                              <SelectItem value="Obra Media">Obra Media</SelectItem>
                              <SelectItem value="Obra Mayor">Obra Mayor</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="font-semibold">{project.project_type}</p>
                        )}
                </div>
                      
                <div>
                        <Label className="text-sm font-medium text-muted-foreground">Tipo de Uso</Label>
                        {isEditing ? (
                          <Select
                            value={editedProject.project_usage || editedProject.project_use || ''}
                            onValueChange={(value) => setEditedProject(prev => ({
                              ...prev,
                              project_usage: value
                            }))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Vivienda">Vivienda</SelectItem>
                              <SelectItem value="Comercial">Comercial</SelectItem>
                              <SelectItem value="Industrial">Industrial</SelectItem>
                              <SelectItem value="Mixto">Mixto</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="font-semibold">{project.project_usage || project.project_use}</p>
                        )}
                </div>
                      
                <div>
                        <Label className="text-sm font-medium text-muted-foreground">Estado del trámite</Label>
                        <div className="mt-1">
                          <Badge className={`${getStatusColor(project.permit_status || '')} text-white`}>
                            {project.permit_status || 'Pendiente'}
                  </Badge>
                </div>
                      </div>
                      
                <div>
                        <Label className="text-sm font-medium text-muted-foreground">Estado de la Boleta</Label>
                        <div className="mt-1">
                          <Badge className="bg-green-500 text-white">Pagado</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Otros Profesionales */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Otros Profesionales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {editedProject.profesionales?.map((profesional, index) => (
                          <div key={index} className="flex gap-3 items-end">
                            <div className="flex-1">
                              <Label htmlFor={`profesional-name-${index}`}>
                                Nombre del Profesional
                              </Label>
                              <Input
                                id={`profesional-name-${index}`}
                                value={profesional.name}
                                onChange={(e) => handleProfesionalChange(index, 'name', e.target.value)}
                                placeholder="Nombre completo"
                              />
                            </div>
                            <div className="flex-1">
                              <Label htmlFor={`profesional-role-${index}`}>
                                Especialidad/Rol
                              </Label>
                              <Select
                                value={profesional.role}
                                onValueChange={(value) => handleProfesionalChange(index, 'role', value as ProjectProfessional['role'])}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Estructuralista">Estructuralista</SelectItem>
                                  <SelectItem value="Proyectista">Proyectista</SelectItem>
                                  <SelectItem value="Instalación Electrica">Instalación Eléctrica</SelectItem>
                                  <SelectItem value="Instalación Sanitaria">Instalación Sanitaria</SelectItem>
                                  <SelectItem value="Instalación e incendios">Instalación e Incendios</SelectItem>
                                  <SelectItem value="Instalación e elevadores">Instalación e Elevadores</SelectItem>
                                  <SelectItem value="Instalación Sala de maquinas">Instalación Sala de Máquinas</SelectItem>
                                  <SelectItem value="Instalación Ventilación Mecanica">Instalación Ventilación Mecánica</SelectItem>
                                  <SelectItem value="Instalación ventilación electromecánica">Instalación Ventilación Electromecánica</SelectItem>
                                  <SelectItem value="Agrimensor">Agrimensor</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {editedProject.profesionales && editedProject.profesionales.length > 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeProfesional(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addProfesional}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Profesional
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {project.profesionales && project.profesionales.length > 0 ? (
                        project.profesionales.map((profesional, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{profesional.name}</p>
                              <p className="text-sm text-muted-foreground">{profesional.role}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          No hay profesionales adicionales registrados
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

          {/* Etapas del proyecto más compactas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Etapas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {projectPhases.map((phase) => (
                  <div key={phase.name} className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-muted-foreground">{phase.name}</span>
                    <div className="flex gap-1">
                      {phase.stages.map((stage) => (
                        <Button
                          key={stage}
                          variant={project.current_stage === stage ? "default" : "outline"}
                          size="sm"
                          onClick={() => onStageChange(project.id, stage)}
                          className="text-xs h-8"
                        >
                          {stage}
                        </Button>
                      ))}
                </div>
                </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pedidos de verificaciones organizadas por categorías */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Pedidos de Verificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Prefactibilidad del proyecto */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b pb-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <h3 className="text-lg font-semibold text-purple-700">Prefactibilidad del proyecto</h3>
                </div>
                <div className="ml-6">
                  <Card className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Documentos de Prefactibilidad</h4>
                        <Badge variant="secondary" className="text-xs">Opcional</Badge>
                      </div>
                      
                      {hasVerificationCertificate('Prefactibilidad del proyecto') ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-green-600">Documentos cargados</span>
                          </div>
                          <div className="text-xs text-blue-600">📄 Documentos disponibles</div>
                          
                          {/* Botones para ver, descargar y eliminar documentos */}
                            <div className="flex gap-1">
                              {getVerificationDocuments('Prefactibilidad del proyecto').map((doc, docIndex) => (
                                <div key={docIndex} className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => handleViewDocument(doc)}
                                    title="Ver documento"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => handleDownloadDocument(doc)}
                                    title="Descargar documento"
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    title="Eliminar documento"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              id="verification-prefactibilidad"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleVerificationUpload('Prefactibilidad del proyecto', file)
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs"
                              onClick={() => document.getElementById('verification-prefactibilidad')?.click()}
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              Actualizar Doc.
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">
                            Documentos iniciales del proyecto
                          </div>
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              id="verification-prefactibilidad"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleVerificationUpload('Prefactibilidad del proyecto', file)
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs"
                              onClick={() => document.getElementById('verification-prefactibilidad')?.click()}
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              Cargar Doc.
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>

              {/* En Gestoria */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b pb-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <h3 className="text-lg font-semibold text-yellow-700">En Gestoria</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-6">
                  {verificationRequests
                    .filter(req => ['Consulta DGIUR', 'Permiso de Demolición', 'Registro etapa de proyecto - Informe', 'Registro etapa de proyecto - Plano', 'Permiso de obra'].includes(req.name))
                    .map((request, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{request.name}</h4>
                          {request.required ? (
                            <Badge variant="secondary" className="text-xs">Requerido</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">No requiere</Badge>
                          )}
                        </div>
                        
                        {/* Checkbox especial para Consulta DGIUR */}
                        {request.name === 'Consulta DGIUR' && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="dgiur-no-docs"
                              checked={dgiurNoDocsRequired}
                              onCheckedChange={(checked) => setDgiurNoDocsRequired(checked as boolean)}
                            />
                            <Label htmlFor="dgiur-no-docs" className="text-xs text-muted-foreground">
                              No requiere documentación
                            </Label>
                          </div>
                        )}
                        
                        {/* Checkbox especial para Permiso de Demolición */}
                        {request.name === 'Permiso de Demolición' && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="demolicion-no-docs"
                              checked={demolicionNoDocsRequired}
                              onCheckedChange={(checked) => setDemolicionNoDocsRequired(checked as boolean)}
                            />
                            <Label htmlFor="demolicion-no-docs" className="text-xs text-muted-foreground">
                              No requiere documentación
                            </Label>
                          </div>
                        )}
                        
                        {hasVerificationCertificate(request.name) ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-xs text-green-600">Completado</span>
                            </div>
                            <div className="text-xs text-blue-600">📄 Certificado disponible</div>
                            
                            {/* Botones para ver, descargar y eliminar documentos de verificación */}
                            <div className="flex gap-1">
                              {getVerificationDocuments(request.name).map((doc, docIndex) => (
                                <div key={docIndex} className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => handleViewDocument(doc)}
                                    title="Ver documento"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => handleDownloadDocument(doc)}
                                    title="Descargar documento"
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    title="Eliminar documento"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            
                            <div className="space-y-2">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                id={`verification-gestoria-${index}`}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleVerificationUpload(request.name, file)
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs"
                                onClick={() => document.getElementById(`verification-gestoria-${index}`)?.click()}
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                Actualizar Doc.
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground">
                              {(request.name === 'Consulta DGIUR' && dgiurNoDocsRequired) || 
                               (request.name === 'Permiso de Demolición' && demolicionNoDocsRequired) ? 
                                'No requiere documentación' : 
                                (request.required ? 'Pendiente' : 'No aplicable')
                              }
                            </div>
                            {!((request.name === 'Consulta DGIUR' && dgiurNoDocsRequired) || 
                               (request.name === 'Permiso de Demolición' && demolicionNoDocsRequired)) && (
                              <div className="space-y-2">
                                {/* Campo único para documentos */}
                                <div>
                                  <input
                                    type="file"
                                    accept={request.name.includes('Plano') ? ".pdf,.dwg,.jpg,.jpeg,.png" : ".pdf,.doc,.docx"}
                                    className="hidden"
                                    id={`verification-gestoria-${index}`}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) {
                                        handleVerificationUpload(request.name, file)
                                      }
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-xs"
                                    onClick={() => document.getElementById(`verification-gestoria-${index}`)?.click()}
                                  >
                                    <Upload className="h-3 w-3 mr-1" />
                                    Cargar Doc.
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* En ejecución de obra */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b pb-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <h3 className="text-lg font-semibold text-green-700">En ejecución de obra</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-6">
                  {verificationRequests
                    .filter(req => ['Demolición', 'Excavación', 'AVO 1', 'AVO 2', 'AVO 3'].includes(req.name))
                    .map((request, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{request.name}</h4>
                          {request.required ? (
                            <Badge variant="secondary" className="text-xs">Requerido</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">No requiere</Badge>
                          )}
                        </div>
                        
                        {hasVerificationCertificate(request.name) ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-xs text-green-600">Completado</span>
                            </div>
                            <div className="text-xs text-blue-600">📄 Certificado disponible</div>
                            
                            {/* Botones para ver, descargar y eliminar documentos de verificación */}
                            <div className="flex gap-1">
                              {getVerificationDocuments(request.name).map((doc, docIndex) => (
                                <div key={docIndex} className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => handleViewDocument(doc)}
                                    title="Ver documento"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => handleDownloadDocument(doc)}
                                    title="Descargar documento"
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    title="Eliminar documento"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            
                            <div className="space-y-2">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                id={`verification-obra-${index}`}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleVerificationUpload(request.name, file)
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs"
                                onClick={() => document.getElementById(`verification-obra-${index}`)?.click()}
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                Actualizar Doc.
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground">
                              {request.required ? 'Pendiente' : 'No aplicable'}
                            </div>
                            <div className="space-y-2">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                id={`verification-obra-${index}`}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleVerificationUpload(request.name, file)
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs"
                                onClick={() => document.getElementById(`verification-obra-${index}`)?.click()}
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                Cargar Doc.
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Finalización */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b pb-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                  <h3 className="text-lg font-semibold text-emerald-700">Finalización</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-6">
                  {verificationRequests
                    .filter(req => ['Conforme de obra', 'MH-SUBDIVISION'].includes(req.name))
                    .map((request, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{request.name}</h4>
                          {request.required ? (
                            <Badge variant="secondary" className="text-xs">Requerido</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">No requiere</Badge>
                          )}
                        </div>
                        
                        {hasVerificationCertificate(request.name) ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-xs text-green-600">Completado</span>
                            </div>
                            <div className="text-xs text-blue-600">📄 Certificado disponible</div>
                            
                            {/* Botones para ver, descargar y eliminar documentos de verificación */}
                            <div className="flex gap-1">
                              {getVerificationDocuments(request.name).map((doc, docIndex) => (
                                <div key={docIndex} className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => handleViewDocument(doc)}
                                    title="Ver documento"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => handleDownloadDocument(doc)}
                                    title="Descargar documento"
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    title="Eliminar documento"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            
                            <div className="space-y-2">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                id={`verification-final-${index}`}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleVerificationUpload(request.name, file)
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs"
                                onClick={() => document.getElementById(`verification-final-${index}`)?.click()}
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                Actualizar Doc.
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground">
                              {request.required ? 'Pendiente' : 'No aplicable'}
                            </div>
                            <div className="space-y-2">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                id={`verification-final-${index}`}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleVerificationUpload(request.name, file)
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs"
                                onClick={() => document.getElementById(`verification-final-${index}`)?.click()}
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                Cargar Doc.
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sistema de pestañas para documentos y nuevas funcionalidades */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="documentos" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentos
                <Badge variant="outline" className="ml-1">{documents.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="informe-dominio" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Informe de Dominio
              </TabsTrigger>
              <TabsTrigger value="tasas" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Tasas Gubernamentales
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documentos" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Todos los Documentos
                    <Badge variant="outline" className="ml-2">{documents.length} documentos</Badge>
                  </CardTitle>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      multiple
                      className="hidden"
                      id="document-upload"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        files.forEach(file => {
                          if (uploadingTo) {
                            handleFileUpload(file, uploadingTo)
                          }
                        })
                      }}
                    />
                    <Select onValueChange={(value) => setUploadingTo(value)}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Seleccionar sección..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planos de Proyecto e Instalaciones">Planos de Proyecto</SelectItem>
                        <SelectItem value="Documentación Municipal y Gestoría">Doc. Municipal</SelectItem>
                        <SelectItem value="Servicios Públicos">Servicios Públicos</SelectItem>
                        <SelectItem value="Profesionales Intervinientes">Profesionales</SelectItem>
                        <SelectItem value="Seguros y Documentación Administrativa">Seguros y Admin</SelectItem>
                        <SelectItem value="Pagos y Comprobantes">Pagos y Comprobantes</SelectItem>
                        <SelectItem value="Informe de Dominio">Informe de Dominio</SelectItem>
                        <SelectItem value="Verificaciones">Verificaciones</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      disabled={!uploadingTo || uploading}
                      onClick={() => document.getElementById('document-upload')?.click()}
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Cargar Documentos
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {!tableExists && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertCircle className="h-5 w-5" />
                        <strong>Problema con la tabla de documentos</strong>
                      </div>
                      <p className="text-sm text-yellow-700 mt-2">
                        La tabla &apos;project_documents&apos; no existe o no tiene la estructura correcta. 
                        Mostrando datos de ejemplo. Para arreglar esto:
                      </p>
                      <ol className="text-sm text-yellow-700 mt-2 ml-4 list-decimal">
                        <li>Ve a tu dashboard de Supabase → SQL Editor</li>
                        <li>Ejecuta el SQL de corrección (ver consola del navegador)</li>
                        <li>Recarga esta página</li>
                      </ol>
                      <div className="mt-3 p-2 bg-yellow-100 rounded text-xs font-mono text-yellow-800">
                        DROP TABLE IF EXISTS project_documents; CREATE TABLE project_documents (...);
                      </div>
                    </div>
                  )}

                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p>Cargando documentos...</p>
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No hay documentos regulares cargados</p>
                      <p className="text-sm mt-2">Use las secciones superiores para gestionar informe de dominio y tasas</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Agrupar documentos por sección */}
                      {Object.entries(
                        documents.reduce((acc, doc) => {
                          if (!acc[doc.section]) {
                            acc[doc.section] = []
                          }
                          acc[doc.section].push(doc)
                          return acc
                        }, {} as Record<string, typeof documents>)
                      ).map(([section, sectionDocs]) => (
                        <div key={section}>
                          <h4 className="font-medium text-sm text-gray-700 mb-3 pb-2 border-b">
                            {section} ({sectionDocs.length} documento{sectionDocs.length !== 1 ? 's' : ''})
                          </h4>
                          <div className="space-y-2">
                            {sectionDocs.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{getFileIcon(doc.type)}</span>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-sm">{doc.name}</h4>
                                      {doc.isSpecial && (
                                        <Badge variant={doc.isValid ? "default" : "destructive"} className="text-xs">
                                          {doc.isValid ? 'Válido' : 'Vencido'}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <span>{doc.uploadDate}</span>
                                      <span>{doc.size}</span>
                                      {doc.validUntil && (
                                        <span>Vence: {new Date(doc.validUntil).toLocaleDateString()}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleViewDocument(doc)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleDownloadDocument(doc)}>
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  {!doc.isSpecial && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleDeleteDocument(doc.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="informe-dominio" className="space-y-6 mt-6">
              <DomainReportSection 
                project={project} 
                onProjectUpdate={onProjectUpdate}
              />
            </TabsContent>

            <TabsContent value="tasas" className="space-y-6 mt-6">
              <GovernmentTaxesSection 
                project={project} 
                onProjectUpdate={onProjectUpdate}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar derecho - Cliente y Detalles */}
        <div className="xl:col-span-1 space-y-6 xl:sticky xl:top-6 xl:self-start">
          {/* Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                  <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{project.client?.name || 'Sin cliente'}</h3>
                    <p className="text-sm text-muted-foreground">Cliente principal</p>
                  </div>
                </div>
                
                {project.client && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{project.client.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{project.client.phone}</span>
                    </div>
                    {project.client.address && (
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{project.client.address}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profesionales del Proyecto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Profesionales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Director de Obra */}
                <div className="border-b pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Director de Obra</p>
                      <p className="text-xs text-muted-foreground">
                        {project.director_obra || project.architect || 'No asignado'}
                      </p>
                    </div>
                    <Badge variant="default" className="text-xs">
                      Principal
                    </Badge>
                  </div>
                </div>

                {/* Constructor */}
                {project.builder && (
                  <div className="border-b pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Building className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Constructor</p>
                        <p className="text-xs text-muted-foreground">
                          {project.builder}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Empresa
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Otros Profesionales */}
                {project.profesionales && project.profesionales.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Otros Profesionales</h4>
                    {project.profesionales.map((profesional, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{profesional.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {profesional.role}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Especialista
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      No hay profesionales adicionales asignados
                    </p>
                  </div>
                )}

                {/* Profesional Legacy (inspector_name) para compatibilidad */}
                {project.inspector_name && !project.profesionales?.length && (
                  <div className="border-t pt-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{project.inspector_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Inspector/Especialista
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Legacy
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detalles del Proyecto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Detalles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Presupuesto</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedProject.budget || ''}
                      onChange={(e) => setEditedProject(prev => ({
                        ...prev,
                        budget: parseFloat(e.target.value) || 0
                      }))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-semibold text-lg">${project.budget?.toLocaleString()}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Fecha de inicio</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedProject.start_date || ''}
                      onChange={(e) => setEditedProject(prev => ({
                        ...prev,
                        start_date: e.target.value
                      }))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-semibold">{project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Fecha estimada de fin</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedProject.end_date || ''}
                      onChange={(e) => setEditedProject(prev => ({
                        ...prev,
                        end_date: e.target.value
                      }))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-semibold">{project.end_date ? new Date(project.end_date).toLocaleDateString() : '-'}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Inspector</Label>
                  {isEditing ? (
                    <Input
                      value={editedProject.inspector_name || ''}
                      onChange={(e) => setEditedProject(prev => ({
                        ...prev,
                        inspector_name: e.target.value
                      }))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-semibold">{project.inspector_name || '-'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
    </div>
  )
}