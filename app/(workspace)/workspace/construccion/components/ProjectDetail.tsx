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
  X,
  Shield
} from 'lucide-react'
import Image from 'next/image'
import { Project, mockProjectStages, ProjectProfessional } from '@/lib/construction'
import { uploadProjectImage } from '@/lib/storage'
import { useDirectFileUpload } from '@/lib/hooks/useDirectFileUpload'
import { useWorkspace } from '@/components/workspace-context'
import { sanitizeFileName, generateUniqueFilePath } from '@/lib/utils/file-utils'
import DomainReportSection from './DomainReportSection'
import InsurancePolicySection from './InsurancePolicySection'
import OtherDocuments from './OtherDocuments'
import ExpedientesManager from '@/components/ExpedientesManager'
import DocumentUpload from './DocumentUpload'
import { DeadlineStatus } from './DeadlineStatus'
import { DeadlineClientPanel } from './DeadlineClientPanel'
import ProjectHeader from './ProjectHeader'
import ProjectProfessionalsCard from './ProjectProfessionalsCard'
import ClientInfoCard from './ClientInfoCard'
import ProjectDetailsCard from './ProjectDetailsCard'
import ProjectStages from './ProjectStages'
import ProjectGeneralInfo from './ProjectGeneralInfo'
import { ProjectVerificationRequests } from './ProjectVerificationRequests'
import ProjectAllDocuments from './ProjectAllDocuments'
import ProjectTabs, { TabId } from './ProjectTabs'
import ProjectSummaryTab from './ProjectSummaryTab'
import ProjectStagesTab from './ProjectStagesTab'
import ProjectTeamTab from './ProjectTeamTab'
import ProjectDocumentsTab from './ProjectDocumentsTab'
import ProjectEconomicTab from './ProjectEconomicTab'


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
  { name: 'Permiso de Demolición - Informe', required: false },
  { name: 'Permiso de Demolición - Plano', required: false },
  { name: 'Registro etapa de proyecto - Informe', required: true },
  { name: 'Registro etapa de proyecto - Plano', required: true },
  { name: 'Permiso de obra', required: true },
  { name: 'Alta Inicio de obra', required: true },
  { name: 'Cartel de Obra', required: true },
  { name: 'Demolición', required: false },
  { name: 'Excavación', required: false },
  { name: 'AVO 1', required: true },
  { name: 'AVO 2', required: true },
  { name: 'AVO 3', required: true },
  { name: 'Conforme de obra', required: true },
  { name: 'MH-SUBDIVISION', required: true }
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
  const [activeTab, setActiveTab] = useState<TabId>('summary')
  
  // Hook para obtener el workspace actual
  const { companyId, isLoading: workspaceLoading } = useWorkspace()
  
  // Hook para manejar subidas de imágenes con Supabase Storage
  const { uploadFile, progress: imageUploadProgress, isUploading: isUploadingImage } = useDirectFileUpload()
  
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
  // Función auxiliar para determinar si una sección debe mostrar el campo de fecha de carga
  const shouldShowUploadDate = (sectionName: string): boolean => {
    const sectionsWithUploadDate = [
      // Documentos de gestoría
      'Consulta DGIUR',
      'Permiso de Demolición - Informe', 
      'Permiso de Demolición - Plano', 
      'Registro etapa de proyecto - Informe', 
      'Registro etapa de proyecto - Plano', 
      'Permiso de obra',
      // Documentos de ejecución de obra
      'Alta Inicio de obra',
      'Cartel de Obra',
      'Demolición',
      'Excavación',
      'AVO 1', 
      'AVO 2', 
      'AVO 3',
      // Documentos de finalización
      'Conforme de obra',
      'MH-SUBDIVISION'
    ]
    
    // Solo mostrar si la sección requiere fecha de carga Y tiene documentos subidos
    return sectionsWithUploadDate.includes(sectionName) && sectionsWithDocuments.has(sectionName)
  }

  // Función para manejar cambios en las fechas de carga
  const handleUploadDateChange = (sectionName: string, date: string) => {
    // Solo actualizar estado local, no guardar automáticamente
    setUploadDates(prev => ({
      ...prev,
      [sectionName]: date
    }))
  }

  // Función para manejar cuando se sube un documento
  const handleDocumentUploaded = (sectionName: string) => {
    setSectionsWithDocuments(prev => new Set([...prev, sectionName]))
  }
  const handleSaveUploadDate = async (sectionName: string, date: string) => {
    setSavingDates(prev => ({ ...prev, [sectionName]: true }))
    
    try {
      // Asegurar que la fecha se envíe correctamente sin problemas de zona horaria
      const dateToSave = date + 'T12:00:00.000Z' // Agregar hora del mediodía UTC
      
      const response = await fetch('/api/workspace/construction/upload-dates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: project.id,
          section_name: sectionName,
          upload_date: dateToSave
        }),
      })

      if (!response.ok) {
        throw new Error('Error al guardar fecha de carga')
      }

      // Actualizar estado de fechas guardadas
      setSavedUploadDates(prev => ({
        ...prev,
        [sectionName]: date
      }))

      console.log(`Fecha de carga guardada para ${sectionName}: ${date}`)
    } catch (error) {
      console.error('Error saving upload date:', error)
      alert('Error al guardar la fecha de carga. Por favor, inténtalo de nuevo.')
    } finally {
      setSavingDates(prev => ({ ...prev, [sectionName]: false }))
    }
  }

  // Función para configurar fecha de carga a hoy
  const setTodayUploadDate = (sectionName: string) => {
    const today = new Date()
    const dateString = today.toISOString().split('T')[0]
    
    // Actualizar estado local
    setUploadDates(prev => ({
      ...prev,
      [sectionName]: dateString
    }))
    
    // Guardar automáticamente
    handleSaveUploadDate(sectionName, dateString)
  }

  useEffect(() => {
    setUploadingImage(isUploadingImage)
  }, [isUploadingImage])
  
  const [dgiurNoDocsRequired, setDgiurNoDocsRequired] = useState(false)
  const [demolicionNoDocsRequired, setDemolicionNoDocsRequired] = useState(false)
  const [expedientes, setExpedientes] = useState(project.expedientes || [])

  // Debug: Log del proyecto y expedientes
  console.log('🔍 DEBUG ProjectDetail: project recibido:', project)
  console.log('🔍 DEBUG ProjectDetail: project.expedientes:', project?.expedientes)
  console.log('🔍 DEBUG ProjectDetail: estado expedientes:', expedientes)
  
  // Estados para fechas de carga
  const [uploadDates, setUploadDates] = useState<Record<string, string>>({
    'Permiso de Demolición - Informe': '',
    'Permiso de Demolición - Plano': '',
    'Permiso de obra': '',
    'Registro etapa de proyecto - Informe': '',
    'Registro etapa de proyecto - Plano': '',
    'AVO 1': '',
    'AVO 2': '',
    'AVO 3': ''
  })

  // Estados para fechas guardadas
  const [savedUploadDates, setSavedUploadDates] = useState<Record<string, string>>({})
  const [savingDates, setSavingDates] = useState<Record<string, boolean>>({})
  const [sectionsWithDocuments, setSectionsWithDocuments] = useState<Set<string>>(new Set())

  useEffect(() => {
    console.log('🔍 DEBUG ProjectDetail: useEffect project change')
    console.log('🔍 DEBUG ProjectDetail: project.expedientes en useEffect:', project?.expedientes)
    setEditedProject(project)
    setExpedientes(project.expedientes || [])
    console.log('🔍 DEBUG ProjectDetail: expedientes establecidos:', project.expedientes || [])
    loadProjectDocuments()
    loadUploadDates()
  }, [project])

  // Función para cargar fechas de carga existentes
  const loadUploadDates = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/workspace/construction/upload-dates?projectId=${project.id}`)
      
      if (response.ok) {
        const dates = await response.json()
        const datesMap: Record<string, string> = {}
        const savedDatesMap: Record<string, string> = {}
        
        dates.forEach((item: any) => {
          const dateOnly = item.upload_date.split('T')[0] // Solo la fecha, sin hora
          datesMap[item.section_name] = dateOnly
          savedDatesMap[item.section_name] = dateOnly
        })
        
        setUploadDates(prev => ({
          ...prev,
          ...datesMap
        }))
        
        setSavedUploadDates(savedDatesMap)
      }
    } catch (error) {
      console.error('Error loading upload dates:', error)
    }
  }

  const handleExpedientesChange = (newExpedientes: any[]): void => {
    console.log('🔍 DEBUG ProjectDetail: Recibiendo nuevos expedientes:', newExpedientes)
    console.log('🔍 DEBUG ProjectDetail: Estado actual de expedientes:', expedientes)
    
    setExpedientes(newExpedientes)
    
    // IMPORTANTE: También actualizar editedProject para que handleSave incluya los expedientes
    setEditedProject(prev => ({
      ...prev,
      expedientes: newExpedientes
    }))
    
    console.log('🔍 DEBUG ProjectDetail: Expedientes actualizados en estado local y editedProject')
  }

  const handleProjectReload = async (): Promise<void> => {
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

  const loadProjectDocuments = async (): Promise<void> => {
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

        // Actualizar sectionsWithDocuments basado en los documentos cargados
        const sectionsWithDocs = new Set<string>()
        apiDocuments.forEach((doc: any) => {
          if (doc.section_name) {
            sectionsWithDocs.add(doc.section_name)
          }
        })
        setSectionsWithDocuments(sectionsWithDocs)
      } else {
        const errorData = await response.json()
        if (errorData.error && errorData.error.includes('project_documents')) {
          setTableExists(false)
        } else if (errorData.error && errorData.error.includes('estructura correcta')) {
          setTableExists(false)
        }
        // Usar documentos mock en caso de error
        allDocuments = [...mockDocuments]
        
        // También actualizar sectionsWithDocuments para documentos mock
        const sectionsWithDocs = new Set<string>()
        mockDocuments.forEach((doc: any) => {
          if (doc.section) {
            sectionsWithDocs.add(doc.section)
          }
        })
        setSectionsWithDocuments(sectionsWithDocs)
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
        
        // Agregar la sección del informe de dominio
        setSectionsWithDocuments(prev => new Set([...prev, 'Informe de Dominio']))
      }

      // Agregar póliza de seguro si existe
      if (project.insurance_policy_file_url) {
        const insurancePolicyDoc: ProjectDocument = {
          id: 'insurance-policy',
          name: 'Póliza de Seguro.pdf',
          section: 'Póliza de Seguro',
          uploadDate: project.insurance_policy_issue_date ? 
            new Date(project.insurance_policy_issue_date).toISOString().split('T')[0] : 
            'Fecha no disponible',
          size: 'N/A',
          type: 'pdf',
          url: project.insurance_policy_file_url,
          isSpecial: true,
          validUntil: project.insurance_policy_expiry_date || undefined,
          isValid: project.insurance_policy_is_valid || undefined
        }
        allDocuments.unshift(insurancePolicyDoc)
        
        // Agregar la sección de la póliza de seguro
        setSectionsWithDocuments(prev => new Set([...prev, 'Póliza de Seguro']))
      }
      
      // Establecer documentos directamente
      setDocuments(allDocuments)
    } catch (error) {
      console.error('Error loading documents:', error)
      // Mantener documentos mock en caso de error
      setDocuments(mockDocuments)
      
      // También actualizar sectionsWithDocuments para documentos mock en caso de error
      const sectionsWithDocs = new Set<string>()
      mockDocuments.forEach((doc: any) => {
        if (doc.section) {
          sectionsWithDocs.add(doc.section)
        }
      })
      setSectionsWithDocuments(sectionsWithDocs)
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
      const timestamp = Date.now()
      const sanitizedFileName = sanitizeFileName(file.name)
      const fileName = `${timestamp}-${sanitizedFileName}`
      const result = await uploadFile({
        bucket: 'company-logos',
        path: `project-covers/${fileName}`,
        file
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
  
  const handleDocumentUploadSuccess = async (fileUrl: string, fileName: string, originalFileName: string, fileSize: number, mimeType: string, sectionName: string) => {
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
          originalFileName,
          projectId: project.id,
          sectionName: sectionName,
          description: `Documento de ${sectionName}`,
          fileSize,
          mimeType
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
      // Validar que companyId esté disponible
      if (!companyId) {
        throw new Error('Faltan datos requeridos para Supabase Storage: companyId no disponible')
      }
      
      setUploading(true)
      setCurrentUploadSection(section)
      setUploadingTo(null)
      
      // Generar ruta única para el archivo
      const path = generateUniqueFilePath({
        companyId: companyId,
        projectId: project.id,
        section: section,
        fileName: file.name
      })
      
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
        await handleDocumentUploadSuccess(result.publicUrl, path, file.name, file.size, file.type, section)
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

  // Helper: convertir tamaños tipo "8.1 MB" a bytes para DocumentSection
  const parseSizeToBytes = (sizeStr?: string): number => {
    if (!sizeStr) return 0
    const match = /([\d,.]+)\s*(KB|MB|GB)/i.exec(sizeStr)
    if (!match) return 0
    const value = parseFloat(match[1].replace(',', '.'))
    const unit = match[2].toUpperCase()
    const mult: Record<string, number> = { KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 }
    return Math.round(value * (mult[unit] || 1))
  }

  // Documentos externos por sección con shape esperado por DocumentSection
  const getSectionExternalDocs = (sectionName: string) =>
    documents
      .filter(d => d.section === sectionName)
      .map(d => ({
        id: d.id,
        name: d.name,
        size: parseSizeToBytes(d.size),
        type: d.type,
        uploadDate: d.uploadDate,
        url: d.url || ''
      }))

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
      profesionales: [...(prev.profesionales || []), { name: '', role: 'Estructuralista' as const, roles: ['Estructuralista'] }]
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
        <ProjectHeader
          project={project}
          isEditing={isEditing}
          onBack={onBack}
          onEdit={() => setIsEditing(true)}
          onSave={handleSave}
          onCancel={() => {
            setIsEditing(false)
            setEditedProject(project) // Restaurar datos originales
          }}
          onDelete={onDeleteProject}
        />

        {/* Sistema de pestañas */}
        <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Contenido de las pestañas */}
        {activeTab === 'summary' && (
          <ProjectSummaryTab 
            project={project}
            isEditing={isEditing}
            editedProject={editedProject}
            setEditedProject={setEditedProject}
            onProjectUpdate={onProjectUpdate}
            expedientes={expedientes}
            handleExpedientesChange={handleExpedientesChange}
            handleProjectReload={handleProjectReload}
          />
        )}

        {activeTab === 'stages-documents' && (
          <ProjectStagesTab 
            project={project}
            currentStage={project.current_stage || ''}
            onStageChange={onStageChange}
            verificationRequests={verificationRequests}
            documents={documents}
            uploadingTo={uploadingTo}
            loading={loading}
            tableExists={tableExists}
            uploading={uploading}
            uploadingImage={uploadingImage}
            currentUploadSection={currentUploadSection}
            dgiurNoDocsRequired={dgiurNoDocsRequired}
            demolicionNoDocsRequired={demolicionNoDocsRequired}
            uploadDates={uploadDates}
            onDocumentUploaded={handleDocumentUploaded}
            onImageUploadSuccess={handleImageUploadSuccess}
            onImageUploadError={handleImageUploadError}
            shouldShowUploadDate={shouldShowUploadDate}
            onUploadDateChange={handleUploadDateChange}
            onSaveUploadDate={(requestName: string) => handleSaveUploadDate(requestName, uploadDates[requestName] || '')}
            setTodayUploadDate={setTodayUploadDate}
            expedientes={expedientes}
            handleExpedientesChange={handleExpedientesChange}
            handleProjectReload={handleProjectReload}
            savingDates={savingDates}
            savedUploadDates={savedUploadDates}
            hasVerificationCertificate={hasVerificationCertificate}
            getSectionExternalDocs={getSectionExternalDocs}
            loadProjectDocuments={loadProjectDocuments}
            setDgiurNoDocsRequired={setDgiurNoDocsRequired}
            setDemolicionNoDocsRequired={setDemolicionNoDocsRequired}
          />
        )}

        {activeTab === 'team' && (
          <ProjectTeamTab 
            project={project}
            isEditing={isEditing}
            editedProject={editedProject}
            setEditedProject={setEditedProject}
          />
        )}

        {activeTab === 'documents' && (
          <ProjectDocumentsTab 
            project={project}
            documents={documents}
            uploadingTo={uploadingTo}
            loading={loading}
            tableExists={tableExists}
            uploading={uploading}
            uploadingImage={uploadingImage}
            currentUploadSection={currentUploadSection}
            dgiurNoDocsRequired={dgiurNoDocsRequired}
            demolicionNoDocsRequired={demolicionNoDocsRequired}
            expedientes={expedientes}
            uploadDates={uploadDates}
            onDocumentUploaded={handleDocumentUploaded}
            onImageUploadSuccess={handleImageUploadSuccess}
            onImageUploadError={handleImageUploadError}
            shouldShowUploadDate={shouldShowUploadDate}
            onUploadDateChange={handleUploadDateChange}
            onSaveUploadDate={(requestName: string) => handleSaveUploadDate(requestName, uploadDates[requestName] || '')}
            setTodayUploadDate={setTodayUploadDate}
          />
        )}

        {activeTab === 'economic' && (
          <ProjectEconomicTab 
            project={project}
            isEditing={isEditing}
            editedProject={editedProject}
            setEditedProject={setEditedProject}
          />
        )}
      </div>
    </div>
  )
}