'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Upload, 
  FileText,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { Project } from '@/lib/construction'
import { cn } from '@/lib/utils'
import OtherDocuments from './OtherDocuments'
import { ProjectVerificationRequests } from './ProjectVerificationRequests'
import ProjectStages from './ProjectStages'

interface ProjectStagesTabProps {
  project: Project
  verificationRequests: Array<{ name: string; required: boolean }>
  documents?: any[]
  uploadingTo?: string | null
  loading?: boolean
  tableExists?: boolean
  uploading?: boolean
  uploadingImage?: boolean
  currentUploadSection?: string | null
  dgiurNoDocsRequired?: boolean
  demolicionNoDocsRequired?: boolean
  uploadDates?: Record<string, string>
  onDocumentUploaded?: (section: string) => void
  onImageUploadSuccess?: (section: string, url: string) => void
  onImageUploadError?: (section: string, error: string) => void
  shouldShowUploadDate?: (sectionName: string) => boolean
  onUploadDateChange?: (sectionName: string, date: string) => void
  onSaveUploadDate?: (requestName: string) => void
  setTodayUploadDate?: (sectionName: string) => void
  // Props para Otros Documentos
  expedientes?: any[]
  handleExpedientesChange?: (expedientes: any[]) => void
  handleProjectReload?: () => void
  // Props adicionales para ProjectVerificationRequests
  savingDates?: Record<string, boolean>
  savedUploadDates?: Record<string, string>
  hasVerificationCertificate?: (sectionName: string) => boolean
  getSectionExternalDocs?: (sectionName: string) => any[]
  loadProjectDocuments?: () => void
  setDgiurNoDocsRequired?: (value: boolean) => void
  setDemolicionNoDocsRequired?: (value: boolean) => void
  // Props para ProjectStages
  currentStage?: string
  onStageChange?: (projectId: string, newStage: string) => void
}

// Definir las fases del proyecto y sus sub-etapas
const projectPhases = [
  {
    id: 'prefactibilidad',
    title: 'Prefactibilidad del proyecto',
    description: 'Estudios iniciales y análisis de viabilidad',
    status: 'completed' as const,
    subStages: [
      { name: 'Consulta DGIUR', required: true, status: 'completed' as const, responsible: 'Arquitecto' }
    ]
  },
  {
    id: 'gestoria',
    title: 'En Gestoría',
    description: 'Trámites y permisos municipales',
    status: 'in_progress' as const,
    subStages: [
      { name: 'Permiso de Demolición - Informe', required: false, status: 'pending' as const, responsible: 'Gestor' },
      { name: 'Permiso de Demolición - Plano', required: false, status: 'pending' as const, responsible: 'Arquitecto' },
      { name: 'Registro etapa de proyecto - Informe', required: true, status: 'in_progress' as const, responsible: 'Gestor' },
      { name: 'Registro etapa de proyecto - Plano', required: true, status: 'pending' as const, responsible: 'Arquitecto' },
      { name: 'Permiso de obra', required: true, status: 'pending' as const, responsible: 'Gestor' }
    ]
  },
  {
    id: 'ejecucion',
    title: 'En ejecución de obra',
    description: 'Construcción y supervisión de obra',
    status: 'pending' as const,
    subStages: [
      { name: 'Alta Inicio de obra', required: true, status: 'pending' as const, responsible: 'Director de Obra' },
      { name: 'Cartel de Obra', required: true, status: 'pending' as const, responsible: 'Constructor' },
      { name: 'Demolición', required: false, status: 'pending' as const, responsible: 'Constructor' },
      { name: 'Excavación', required: false, status: 'pending' as const, responsible: 'Constructor' },
      { name: 'AVO 1', required: true, status: 'pending' as const, responsible: 'Director de Obra' },
      { name: 'AVO 2', required: true, status: 'pending' as const, responsible: 'Director de Obra' },
      { name: 'AVO 3', required: true, status: 'pending' as const, responsible: 'Director de Obra' }
    ]
  },
  {
    id: 'finalizacion',
    title: 'Finalización',
    description: 'Cierre y documentación final',
    status: 'pending' as const,
    subStages: [
      { name: 'Conforme de obra', required: true, status: 'pending' as const, responsible: 'Director de Obra' },
      { name: 'MH-SUBDIVISION', required: true, status: 'pending' as const, responsible: 'Gestor' }
    ]
  }
]

type StageStatus = 'pending' | 'in_progress' | 'completed' | 'rejected'

const getStatusColor = (status: StageStatus) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 border-green-200'
    case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getStatusIcon = (status: StageStatus) => {
  switch (status) {
    case 'completed': return <CheckCircle className="h-4 w-4" />
    case 'in_progress': return <Clock className="h-4 w-4" />
    case 'rejected': return <AlertCircle className="h-4 w-4" />
    default: return <Clock className="h-4 w-4" />
  }
}

const getStatusText = (status: StageStatus) => {
  switch (status) {
    case 'completed': return 'Completado'
    case 'in_progress': return 'En Progreso'
    case 'rejected': return 'Rechazado'
    default: return 'Pendiente'
  }
}

const getPhaseStatusColor = (status: StageStatus) => {
  switch (status) {
    case 'completed': return 'border-green-500 bg-green-50'
    case 'in_progress': return 'border-blue-500 bg-blue-50'
    case 'rejected': return 'border-red-500 bg-red-50'
    default: return 'border-gray-300 bg-gray-50'
  }
}

export default function ProjectStagesTab({ 
  project, 
  verificationRequests,
  documents = [],
  uploadingTo,
  loading = false,
  tableExists = false,
  uploading = false,
  uploadingImage = false,
  currentUploadSection,
  dgiurNoDocsRequired,
  demolicionNoDocsRequired,
  uploadDates = {},
  onDocumentUploaded,
  onImageUploadSuccess,
  onImageUploadError,
  shouldShowUploadDate,
  onUploadDateChange,
  onSaveUploadDate,
  setTodayUploadDate,
  expedientes = [],
  handleExpedientesChange,
  handleProjectReload,
  // Props adicionales para ProjectVerificationRequests
  savingDates = {},
  savedUploadDates = {},
  hasVerificationCertificate,
  getSectionExternalDocs,
  loadProjectDocuments,
  setDgiurNoDocsRequired,
  setDemolicionNoDocsRequired,
  // Props para ProjectStages
  currentStage,
  onStageChange,
}: ProjectStagesTabProps) {
  const [openPhases, setOpenPhases] = useState<string[]>(['gestoria']) // Gestoría abierta por defecto

  const togglePhase = (phaseId: string) => {
    setOpenPhases(prev => 
      prev.includes(phaseId) 
        ? prev.filter(id => id !== phaseId)
        : [...prev, phaseId]
    )
  }

  // Simular documentos cargados (en una implementación real, esto vendría de props o estado)
  const mockDocuments: Record<string, Array<{ name: string; uploadDate: string; size: string }>> = {
    'Consulta DGIUR': [
      { name: 'consulta-dgiur-2024.pdf', uploadDate: '2024-01-15', size: '1.2 MB' }
    ],
    'Registro etapa de proyecto - Informe': [
      { name: 'registro-informe-v1.pdf', uploadDate: '2024-02-01', size: '2.1 MB' }
    ]
  }

  const getSubStageDocuments = (stageName: string) => {
    return mockDocuments[stageName] || []
  }

  const hasDocuments = (stageName: string) => {
    return getSubStageDocuments(stageName).length > 0
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Etapas y Documentos</h2>
        <p className="text-gray-600">
          Gestiona las fases del proyecto y sus documentos asociados de forma contextual.
        </p>
      </div>

      {/* Sección 1: Etapas del Proyecto */}
      <ProjectStages
        currentStage={currentStage || project.current_stage || ''}
        projectId={project.id}
        onStageChange={onStageChange || (() => {})}
      />

      {/* Sección 2: Carga de Documentación (ProjectVerificationRequests) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Carga de Documentación
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Pedidos de verificaciones organizadas por categorías
          </p>
        </CardHeader>
        <CardContent>
          <ProjectVerificationRequests
             project={project}
             verificationRequests={verificationRequests}
             dgiurNoDocsRequired={dgiurNoDocsRequired || false}
             setDgiurNoDocsRequired={setDgiurNoDocsRequired || (() => {})}
             demolicionNoDocsRequired={demolicionNoDocsRequired || false}
             setDemolicionNoDocsRequired={setDemolicionNoDocsRequired || (() => {})}
             uploadDates={uploadDates}
             handleUploadDateChange={onUploadDateChange || (() => {})}
             handleSaveUploadDate={onSaveUploadDate || (() => {})}
             setTodayUploadDate={setTodayUploadDate || (() => {})}
             savingDates={savingDates}
             savedUploadDates={savedUploadDates}
             shouldShowUploadDate={shouldShowUploadDate || (() => false)}
             hasVerificationCertificate={hasVerificationCertificate || (() => false)}
             getSectionExternalDocs={getSectionExternalDocs || (() => [])}
             handleDocumentUploaded={onDocumentUploaded || (() => {})}
             loadProjectDocuments={loadProjectDocuments || (() => {})}
          />
        </CardContent>
      </Card>

      {/* Sección 3: Otros Documentos */}
      <OtherDocuments
        project={project}
        onProjectUpdate={handleProjectReload}
      />
    </div>
  )
}