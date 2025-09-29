'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Building, 
  Calendar, 
  MapPin, 
  User, 
  FileText, 
  Download, 
  Eye, 
  TrendingUp,
  FileCheck,
  CheckCircle,
  LogOut,
  X
} from 'lucide-react'
import Image from 'next/image'
import DocumentExpirationSection from './components/DocumentExpirationSection'

interface ClientInfo {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
}

interface Project {
  id: string
  name: string
  description?: string
  status: string
  stage: string
  current_stage?: string
  start_date?: string
  end_date?: string
  progress?: number
  client_id: string
  company_id: string
  created_at: string
  project_documents?: any[]
  project_expedientes?: any[]
  clients?: ClientInfo
  cover_image_url?: string
  address?: string
  barrio?: string
  ciudad?: string
  surface?: number
  project_type?: string
  builder?: string
  permit_status?: string
  director_obra?: string
  architect?: string
  profesionales?: any[]
  domain_report_file_url?: string
  domain_report_upload_date?: string
  insurance_policy_file_url?: string
  insurance_policy_issue_date?: string
}

interface ClientViewContentProps {
  projects: Project[]
  clientInfo?: ClientInfo
}

const getStatusColor = (status: string | null | undefined) => {
  if (!status) return 'bg-slate-500'
  switch (status.toLowerCase()) {
    case 'activo':
    case 'en progreso':
    case 'active':
      return 'bg-green-500'
    case 'pausado':
    case 'paused':
      return 'bg-yellow-500'
    case 'completado':
    case 'completed':
      return 'bg-blue-500'
    case 'cancelado':
    case 'cancelled':
      return 'bg-red-500'
    default:
      return 'bg-slate-500'
  }
}

const getStageColor = (stage: string | null | undefined) => {
  if (!stage) return 'bg-slate-500'
  switch (stage.toLowerCase()) {
    case 'prefactibilidad del proyecto':
      return 'bg-purple-500'
    case 'consulta dgiur':
      return 'bg-blue-500'
    case 'permiso de demolición':
      return 'bg-orange-500'
    case 'registro etapa de proyecto':
      return 'bg-indigo-500'
    case 'permiso de obra':
      return 'bg-green-500'
    case 'alta inicio de obra':
      return 'bg-teal-500'
    case 'cartel de obra':
      return 'bg-cyan-500'
    case 'demolición':
      return 'bg-red-500'
    case 'excavación':
      return 'bg-amber-500'
    case 'avo 1':
    case 'avo 2':
    case 'avo 3':
      return 'bg-lime-500'
    case 'conforme de obra':
      return 'bg-emerald-500'
    case 'mh-subdivision':
      return 'bg-violet-500'
    default:
      return 'bg-slate-500'
  }
}

const getStageProgress = (stage: string | null | undefined) => {
  if (!stage) return 0
  const stageMap: { [key: string]: number } = {
    'prefactibilidad del proyecto': 10,
    'consulta dgiur': 20,
    'permiso de demolición': 30,
    'registro etapa de proyecto': 40,
    'permiso de obra': 50,
    'alta inicio de obra': 60,
    'cartel de obra': 65,
    'demolición': 70,
    'excavación': 75,
    'avo 1': 80,
    'avo 2': 85,
    'avo 3': 90,
    'conforme de obra': 95,
    'mh-subdivision': 100
  }
  return stageMap[stage.toLowerCase()] || 0
}

export default function ClientViewContent({ projects, clientInfo }: ClientViewContentProps) {
  const [selectedProject, setSelectedProject] = useState(projects[0] || null)
  const [previewDocument, setPreviewDocument] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/client-login')
  }

  // Función para obtener todos los documentos incluyendo informe de dominio y seguro
  const getAllDocuments = () => {
    const allDocs = [...(selectedProject.project_documents || [])]
    
    // Agregar informe de dominio si existe
    if (selectedProject.domain_report_file_url) {
      allDocs.push({
        id: 'domain-report',
        filename: 'Informe de Dominio.pdf',
        section_name: 'Informe de Dominio',
        file_url: selectedProject.domain_report_file_url,
        upload_date: selectedProject.domain_report_upload_date || new Date().toISOString(),
        mime_type: 'application/pdf',
        isSpecial: true
      })
    }
    
    // Agregar póliza de seguro si existe
    if (selectedProject.insurance_policy_file_url) {
      allDocs.push({
        id: 'insurance-policy',
        filename: 'Póliza de Seguro.pdf',
        section_name: 'Póliza de Seguro',
        file_url: selectedProject.insurance_policy_file_url,
        upload_date: selectedProject.insurance_policy_issue_date || new Date().toISOString(),
        mime_type: 'application/pdf',
        isSpecial: true
      })
    }
    
    return allDocs
  }

  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Building className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-600 mb-2">No hay proyectos disponibles</h2>
          <p className="text-slate-500">No se encontraron proyectos asociados a tu cuenta.</p>
        </div>
      </div>
    )
  }

  // Crear componente de imagen de portada para client-view
  const ProjectCoverImage = ({ project }: { project: any }) => (
    <div className="w-full mb-8">
      <Card className="overflow-hidden border-0 shadow-xl">
        <CardContent className="p-0">
          <div className="relative h-96 bg-gradient-to-br from-slate-100 to-slate-200">
            {project.cover_image_url ? (
              <img
                src={project.cover_image_url}
                alt={project.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Building className="h-20 w-20 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium text-lg">Imagen del Proyecto</p>
                  <p className="text-slate-400">No disponible</p>
                </div>
              </div>
            )}
            
            {/* Overlay con información del proyecto */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 text-white">
              <h1 className="font-bold text-4xl mb-3">{project.name}</h1>
              <div className="flex items-center gap-2 text-xl opacity-90 mb-2">
                <MapPin className="h-5 w-5" />
                <span>{project.address}</span>
              </div>
              {(project.barrio || project.ciudad) && (
                <div className="flex items-center gap-2 text-lg opacity-75">
                  {project.barrio && <span>{project.barrio}</span>}
                  {project.barrio && project.ciudad && <span>•</span>}
                  {project.ciudad && <span>{project.ciudad}</span>}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header con navegación */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Image
                src="/inted.png"
                alt="Logo"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </div>
            
            {/* Botón de cerrar sesión */}
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Imagen de portada del proyecto */}
        <ProjectCoverImage project={selectedProject} />
        
        {/* Badge de etapa fuera de la imagen */}
        <div className="mb-6 flex justify-between items-center">
          <Badge 
            className={`${getStatusColor(selectedProject.current_stage || selectedProject.stage)} text-white font-medium px-4 py-2 text-lg`}
          >
            {selectedProject.current_stage || selectedProject.stage || 'En Proceso'}
          </Badge>
          <div className="text-sm text-slate-600">
            Progreso: {getStageProgress(selectedProject.current_stage || selectedProject.stage)}%
          </div>
        </div>

        {/* Información principal del proyecto */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Información del proyecto */}
          <Card className="lg:col-span-2 border-slate-200 shadow-lg">
            <CardHeader className="bg-slate-800 text-white">
              <CardTitle className="flex items-center gap-2 !text-white">
                <Building className="h-5 w-5" />
                Información del Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Detalles Generales</h4>
                    <div className="space-y-2 text-sm">
                      {selectedProject.surface && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Superficie:</span>
                          <span className="font-medium">{selectedProject.surface} m²</span>
                        </div>
                      )}
                      {selectedProject.project_type && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Tipo:</span>
                          <span className="font-medium">{selectedProject.project_type}</span>
                        </div>
                      )}
                      {selectedProject.builder && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Constructor:</span>
                          <span className="font-medium">{selectedProject.builder}</span>
                        </div>
                      )}
                      {selectedProject.permit_status && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Estado de Permisos:</span>
                          <Badge variant="outline" className="text-xs">
                            {selectedProject.permit_status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Números de expediente */}
                  {selectedProject.project_expedientes && selectedProject.project_expedientes.length > 0 && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Expedientes</h4>
                      <div className="space-y-2">
                        {selectedProject.project_expedientes.map((exp: any) => (
                          <div key={exp.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                            <div>
                              <p className="font-medium text-sm">{exp.expediente_number}</p>
                              <p className="text-xs text-slate-500">{exp.expediente_type}</p>
                            </div>
                            <Badge 
                              variant={exp.status === 'approved' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {exp.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Profesionales */}
                  {selectedProject.director_obra && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Director de Obra</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-slate-500" />
                        <span>{selectedProject.director_obra}</span>
                      </div>
                    </div>
                  )}

                  {selectedProject.architect && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Arquitecto</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-slate-500" />
                        <span>{selectedProject.architect}</span>
                      </div>
                    </div>
                  )}

                  {selectedProject.profesionales && Array.isArray(selectedProject.profesionales) &&
                   selectedProject.profesionales.length > 0 && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Otros Profesionales</h4>
                      <div className="space-y-1">
                        {selectedProject.profesionales.map((prof: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-slate-500" />
                            <span>{prof.name || prof}</span>
                            {prof.role && (
                              <Badge variant="outline" className="text-xs">
                                {prof.role}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progreso y fechas */}
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="bg-slate-800 text-white">
              <CardTitle className="flex items-center gap-2 !text-white">
                <TrendingUp className="h-5 w-5" />
                Progreso del Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Progreso de la etapa */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900">Etapa Actual</h4>
                    <Badge className={getStageColor(selectedProject.current_stage || selectedProject.stage)}>
                      {selectedProject.current_stage || selectedProject.stage}
                    </Badge>
                  </div>
                  <Progress 
                    value={getStageProgress(selectedProject.current_stage || selectedProject.stage)} 
                    className="h-2"
                  />
                  <p className="text-sm text-slate-600">
                    {getStageProgress(selectedProject.current_stage || selectedProject.stage)}% completado
                  </p>
                </div>

                {/* Fechas importantes */}
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900 mb-2">Fechas Importantes</h4>
                  
                  {selectedProject.start_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">Inicio:</span>
                      <span className="font-medium text-slate-900">{new Date(selectedProject.start_date).toLocaleDateString('es-AR')}</span>
                    </div>
                  )}
                  
                  {selectedProject.end_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">Fin estimado:</span>
                      <span className="font-medium text-slate-900">{new Date(selectedProject.end_date).toLocaleDateString('es-AR')}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vigencia de Documentos */}
        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="bg-slate-800 text-white">
            <CardTitle className="flex items-center gap-2 !text-white">
              <Calendar className="h-5 w-5" />
              Vigencia de Documentos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <DocumentExpirationSection projectId={selectedProject.id} />
          </CardContent>
        </Card>

        {/* Documentos organizados por etapas */}
        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="bg-slate-800 text-white">
            <CardTitle className="flex items-center gap-2 !text-white">
              <FileText className="h-5 w-5" />
              Documentos del Proyecto
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {getAllDocuments().length > 0 ? (
              <div className="space-y-6">
                {/* Agrupar documentos por sección/etapa */}
                {Object.entries(
                  getAllDocuments().reduce((acc: any, doc: any) => {
                    const section = doc.section_name || 'Sin categoría'
                    if (!acc[section]) acc[section] = []
                    acc[section].push(doc)
                    return acc
                  }, {})
                ).map(([section, docs]: [string, any]) => (
                  <div key={section} className="border rounded-lg p-4 bg-slate-50">
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <FileCheck className="h-4 w-4" />
                      {section}
                      <Badge variant="secondary" className="ml-2">
                        {(docs as any[]).length} documento{(docs as any[]).length !== 1 ? 's' : ''}
                      </Badge>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(docs as any[]).map((doc: any) => (
                        <div key={doc.id} className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 truncate">{doc.filename || doc.original_filename}</p>
                              <p className="text-sm text-slate-500">
                                {new Date(doc.upload_date || doc.created_at).toLocaleDateString('es-AR')}
                              </p>
                              {doc.file_size && (
                                <p className="text-xs text-slate-400">
                                  {(doc.file_size / 1024 / 1024).toFixed(1)} MB
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => setPreviewDocument(doc)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Ver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => window.open(doc.file_url, '_blank')}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Descargar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No hay documentos disponibles</h3>
                <p className="text-slate-600">Los documentos del proyecto aparecerán aquí cuando estén disponibles.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de previsualización de documentos */}
      <Dialog open={!!previewDocument} onOpenChange={() => setPreviewDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{previewDocument?.filename || previewDocument?.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewDocument(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {previewDocument && (
              <iframe
                src={previewDocument.file_url || previewDocument.url}
                className="w-full h-[70vh] border-0"
                title={previewDocument.filename || previewDocument.name}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}