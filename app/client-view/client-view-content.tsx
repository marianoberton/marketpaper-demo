'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Building,
  Calendar,
  MapPin,
  User,
  Users,
  Mail,
  FileText,
  Download,
  Eye,
  TrendingUp,
  FileCheck,
  CheckCircle,
  LogOut,
  X,
  Search
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import DocumentExpirationSection from './components/DocumentExpirationSection'
import ProjectEconomicInfo from './components/ProjectEconomicInfo'

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
  switch (status?.toLowerCase()) {
    case 'active':
    case 'activo':
      return 'bg-green-50 text-green-700 border-green-200'
    case 'pending':
    case 'pendiente':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    case 'completed':
    case 'completado':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'cancelled':
    case 'cancelado':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

const getStageColor = (stage: string | null | undefined) => {
  // Usar solo el color corporativo #1B293F
  return 'bg-white text-[#1B293F] border-[#1B293F]'
}

const getStageProgress = (stage: string | null | undefined) => {
  switch (stage?.toLowerCase()) {
    case 'planificación':
    case 'planificacion':
    case 'planning':
      return 15
    case 'diseño':
    case 'diseno':
    case 'design':
      return 30
    case 'permisos':
    case 'permits':
      return 45
    case 'construcción':
    case 'construccion':
    case 'construction':
      return 75
    case 'finalización':
    case 'finalizacion':
    case 'completion':
      return 90
    case 'entrega':
    case 'delivery':
      return 100
    default:
      return 50
  }
}

// Componente para mostrar la imagen de portada del proyecto
function ProjectCoverImage({ project }: { project: Project }) {
  return (
    <Card className="shadow-lg border-0 bg-white overflow-hidden mb-8">
      <CardContent className="p-0">
        <div className="relative h-64 bg-gradient-to-br from-slate-100 to-slate-200">
          {project.cover_image_url ? (
            <Image
              src={project.cover_image_url}
              alt={project.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium text-lg">Imagen del Proyecto</p>
                <p className="text-gray-400">No disponible</p>
              </div>
            </div>
          )}
          
          {/* Overlay con información del proyecto */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 text-white">
            <h1 className="font-bold text-3xl mb-2">{project.name}</h1>
            <div className="flex items-center gap-2 text-lg opacity-90 mb-2">
              <MapPin className="h-4 w-4" />
              <span>{project.address}</span>
            </div>
            {(project.barrio || project.ciudad) && (
              <div className="flex items-center gap-2 text-base opacity-75 mb-3">
                {project.barrio && <span>{project.barrio}</span>}
                {project.barrio && project.ciudad && <span>•</span>}
                {project.ciudad && <span>{project.ciudad}</span>}
              </div>
            )}
            {/* Etiqueta de etapa integrada en el header */}
            <div className="flex items-center gap-3">
              <span className="text-white/80 font-medium text-sm">El proyecto se encuentra en la etapa:</span>
              <Badge 
                className="bg-white/20 text-white border-white/30 font-medium px-3 py-1 text-sm backdrop-blur-sm"
                variant="outline"
              >
                {project.current_stage || project.stage || 'En Proceso'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ClientViewContent({ projects, clientInfo }: ClientViewContentProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Obtener proyecto inicial basado en URL o lógica existente
  const getInitialProject = () => {
    const projectId = searchParams.get('project')
    if (projectId) {
      const project = projects.find(p => p.id === projectId)
      if (project) return project
    }
    return projects.length === 1 ? projects[0] : null
  }

  const [selectedProject, setSelectedProject] = useState<Project | null>(getInitialProject())
  const [previewDocument, setPreviewDocument] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  // Actualizar URL cuando cambia el proyecto seleccionado
  useEffect(() => {
    if (selectedProject) {
      const url = new URL(window.location.href)
      url.searchParams.set('project', selectedProject.id)
      window.history.replaceState({}, '', url.toString())
    } else {
      const url = new URL(window.location.href)
      url.searchParams.delete('project')
      window.history.replaceState({}, '', url.toString())
    }
  }, [selectedProject])

  // Función para cambiar proyecto y actualizar URL
  const handleProjectChange = (project: Project | null) => {
    setSelectedProject(project)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/client-login')
  }

  // Función para obtener todos los documentos incluyendo informe de dominio y seguro
  const getAllDocuments = () => {
    // Si no hay proyecto seleccionado, retornar array vacío
    if (!selectedProject) {
      return []
    }
    
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

  // Filtrar documentos basado en el término de búsqueda
  const filteredDocuments = useMemo(() => {
    const allDocs = getAllDocuments()
    
    if (!searchTerm.trim()) {
      return allDocs
    }
    
    return allDocs.filter(doc => 
      doc.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.section_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [selectedProject, searchTerm])

  if (!selectedProject) {
    // Si no hay proyectos
    if (projects.length === 0) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <Building className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">No hay proyectos disponibles</p>
          </div>
        </div>
      )
    }

    // Si hay múltiples proyectos, mostrar pantalla de selección
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header con navegación */}
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <Image
                  src="/inted.png"
                  alt="Logo"
                  width={180}
                  height={60}
                  className="h-12 w-auto"
                />
              </div>
              
              {/* Botón de cerrar sesión */}
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-6">
          {/* Grid de proyectos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-0 shadow-md overflow-hidden"
                onClick={() => setSelectedProject(project)}
               >
                 {/* Imagen de portada del proyecto */}
                 {project.cover_image_url ? (
                   <div className="relative h-48 w-full">
                     <Image
                       src={project.cover_image_url}
                       alt={project.name}
                       fill
                       className="object-cover"
                     />
                     {/* Nombre del proyecto sobre la imagen - solo en la parte inferior */}
                     <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent">
                       <div className="p-4">
                         <h3 className="text-xl font-bold text-white">
                           {project.name}
                         </h3>
                       </div>
                     </div>
                   </div>
                 ) : (
                   <div className="relative h-48 bg-[#1B293F] flex items-center justify-center">
                     <Building className="h-16 w-16 text-white opacity-80" />
                     {/* Nombre del proyecto sobre la imagen de placeholder */}
                     <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent">
                       <div className="p-4">
                         <h3 className="text-xl font-bold text-white">
                           {project.name}
                         </h3>
                       </div>
                     </div>
                   </div>
                 )}

                 <CardContent className="px-4 pb-4 pt-3">
                   {/* Descripción del proyecto */}
                   {project.description && (
                     <div className="mb-3">
                       <p className="text-gray-600 text-sm line-clamp-2">
                         {project.description}
                       </p>
                     </div>
                   )}

                   {/* Botón de acceso */}
                   <Button 
                     className="w-full bg-[#1B293F] hover:bg-[#243447] text-white"
                     onClick={(e) => {
                       e.stopPropagation()
                       handleProjectChange(project)
                     }}
                   >
                     Ver Proyecto
                     <Eye className="h-4 w-4 ml-2" />
                   </Button>
                 </CardContent>
               </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con navegación mejorada */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Image
                src="/inted.png"
                alt="Logo"
                width={180}
                height={60}
                className="h-8 sm:h-10 w-auto"
              />
            </div>
            
            {/* Breadcrumb centrado y elegante - Oculto en móvil */}
            {projects.length > 1 && (
              <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
                <div className="flex items-center gap-3 bg-gray-50 rounded-full px-4 py-2 border border-gray-200">
                  <button
                    onClick={() => handleProjectChange(null)}
                    className="text-gray-600 hover:text-[#1B293F] transition-all duration-200 flex items-center gap-2 hover:bg-white rounded-full px-3 py-1"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm font-medium">Proyectos</span>
                  </button>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <span className="text-[#1B293F] font-semibold text-sm">{selectedProject.name}</span>
                </div>
              </div>
            )}
            
            {/* Controles de la derecha */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Botón de volver en móvil */}
              {projects.length > 1 && (
                <button
                  onClick={() => handleProjectChange(null)}
                  className="md:hidden flex items-center text-gray-600 hover:text-[#1B293F] transition-colors duration-200 p-2 rounded-md hover:bg-gray-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              
              {/* Selector de proyecto elegante (si hay múltiples) - Compacto en móvil */}
              {projects.length > 1 && (
                <div className="relative">
                  <select
                     value={selectedProject.id}
                     onChange={(e) => {
                       const project = projects.find(p => p.id === e.target.value)
                       if (project) handleProjectChange(project)
                     }}
                     className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-2 sm:px-4 py-2 pr-6 sm:pr-8 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1B293F] focus:border-transparent transition-all duration-200 max-w-[120px] sm:max-w-none"
                   >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              )}
              
              {/* Botón de cerrar sesión */}
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 sm:gap-2 text-gray-600 hover:text-[#1B293F] hover:bg-gray-50 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Imagen de portada del proyecto */}
        <ProjectCoverImage project={selectedProject} />

        {/* Grid principal con layout fraccional 50/50 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Información del Proyecto - 50% del ancho */}
          <Card className="shadow-md border-0 bg-white overflow-hidden h-full flex flex-col">
            <div className="bg-[#1B293F] text-white py-6 px-8">
              <div className="flex items-center gap-3">
                <Building className="h-6 w-6" />
                <h2 className="text-xl font-bold">Información del Proyecto</h2>
              </div>
            </div>
            <div className="p-8 flex-1">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-base">Detalles Generales</h4>
                  <div className="space-y-3 text-sm">
                    {selectedProject.surface && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Superficie:</span>
                        <span className="font-medium text-gray-900">{selectedProject.surface} m²</span>
                      </div>
                    )}
                    {selectedProject.project_type && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Tipo:</span>
                        <span className="font-medium text-gray-900">{selectedProject.project_type}</span>
                      </div>
                    )}
                    {selectedProject.builder && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Constructor:</span>
                        <span className="font-medium text-gray-900">{selectedProject.builder}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expedientes */}
                {selectedProject.project_expedientes && selectedProject.project_expedientes.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-base">Expedientes</h4>
                    <div className="space-y-3">
                      {selectedProject.project_expedientes.map((exp: any) => (
                        <div key={exp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div>
                            <p className="font-medium text-sm text-gray-900">{exp.expediente_number}</p>
                            <p className="text-xs text-gray-500">{exp.expediente_type}</p>
                          </div>
                          <Badge 
                            variant="outline"
                            className="text-xs bg-white text-[#1B293F] border-[#1B293F]"
                          >
                            {exp.expediente_type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Información Económica - 50% del ancho */}
          <div className="h-full">
            <ProjectEconomicInfo projectId={selectedProject.id} />
          </div>
        </div>

        {/* Profesionales y Vigencia de Documentos - Layout 50/50 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Profesionales - 50% del ancho */}
          <div>
            <Card className="shadow-md border-0 bg-white overflow-hidden h-full flex flex-col">
              <div className="bg-[#1B293F] text-white py-6 px-8">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6" />
                  <h2 className="text-xl font-bold">Profesionales</h2>
                </div>
              </div>
              <div className="p-8 flex-1">
                {(() => {
                  // Recopilar todos los profesionales
                  const allProfessionals = [];

                  // Director de Obra
                  if (selectedProject.director_obra) {
                    allProfessionals.push({
                      name: selectedProject.director_obra,
                      role: 'Director de Obra'
                    });
                  }

                  // Arquitecto
                  if (selectedProject.architect) {
                    allProfessionals.push({
                      name: selectedProject.architect,
                      role: 'Arquitecto'
                    });
                  }

                  // Otros profesionales
                  if (selectedProject.profesionales && Array.isArray(selectedProject.profesionales)) {
                    selectedProject.profesionales.forEach((prof: any) => {
                      allProfessionals.push({
                        name: prof.name || prof,
                        role: prof.role || 'Profesional'
                      });
                    });
                  }

                  const totalProfessionals = allProfessionals.length;
                  
                  // Layout adaptativo - máximo 2 columnas
                  let gridCols = 'grid-cols-1';
                  if (totalProfessionals >= 2) {
                    gridCols = 'grid-cols-1 md:grid-cols-2';
                  }

                  // Contenedor adaptativo según cantidad
                  const containerClass = totalProfessionals <= 2 ? 'min-h-0' : 'h-full';

                  return (
                    <div className={`grid ${gridCols} gap-4 ${containerClass}`}>
                      {allProfessionals.map((professional, index) => (
                        <div 
                          key={index} 
                          className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#1B293F] to-[#2A3F5F] rounded-full flex items-center justify-center shadow-lg">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 text-base">
                                {professional.name}
                              </h4>
                              <p className="text-sm text-gray-600 font-medium">
                                {professional.role}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Mensaje cuando no hay profesionales */}
                      {totalProfessionals === 0 && (
                        <div className="col-span-full flex items-center justify-center py-12">
                          <div className="text-center">
                            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg font-medium">No hay profesionales registrados</p>
                            <p className="text-gray-400 text-sm mt-2">Los profesionales aparecerán aquí cuando sean asignados</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </Card>
          </div>

          {/* Vigencia de Documentos - 50% del ancho */}
          <div>
            <Card className="shadow-md border-0 bg-white overflow-hidden h-full flex flex-col">
              <div className="bg-[#1B293F] text-white py-6 px-8">
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6" />
                  <h2 className="text-xl font-bold">Vigencia de Documentos</h2>
                </div>
              </div>
              <div className="p-8 flex-1">
                <DocumentExpirationSection projectId={selectedProject.id} />
              </div>
            </Card>
          </div>
        </div>

        {/* Documentos del Proyecto */}
        <Card className="shadow-md border-0 bg-white overflow-hidden">
          <div className="bg-[#1B293F] text-white py-4 sm:py-6 px-4 sm:px-8">
            {/* Header responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                <h2 className="text-lg sm:text-xl font-bold truncate">Documentos del Proyecto</h2>
              </div>
              <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-xs sm:text-sm self-start sm:self-auto">
                {filteredDocuments.length} de {getAllDocuments().length} docs
              </Badge>
            </div>
            
            {/* Buscador */}
            <div className="relative mt-3 sm:mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar documentos o etapas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 text-sm sm:text-base"
              />
            </div>
          </div>
          <div className="p-4 sm:p-6 lg:p-8">
            {filteredDocuments.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                {/* Agrupar documentos filtrados por sección */}
                {Object.entries(
                  filteredDocuments.reduce((acc: any, doc: any) => {
                    const section = doc.section_name || 'Otros Documentos'
                    if (!acc[section]) {
                      acc[section] = []
                    }
                    acc[section].push(doc)
                    return acc
                  }, {})
                ).map(([section, docs]: [string, any]) => (
                  <div key={section} className="border border-gray-200 rounded-xl p-4 sm:p-6 bg-gray-50 h-fit">
                    <h4 className="font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-3 text-base sm:text-lg">
                      <FileCheck className="h-6 w-6 sm:h-7 sm:w-7 text-[#1B293F] flex-shrink-0" />
                      <span className="truncate flex-1 min-w-0">{section}</span>
                    </h4>
                    <div className="space-y-3 sm:space-y-4">
                      {(docs as any[]).map((doc: any, index: number) => {
                        // Determinar el tipo de archivo para mostrar el icono apropiado
                        const getFileIcon = (filename: string) => {
                          if (!filename) return <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 flex-shrink-0" />
                          
                          const extension = filename.toLowerCase().split('.').pop()
                          
                          if (extension === 'pdf') {
                            return <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-[#1B293F] flex-shrink-0" />
                          } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension || '')) {
                            return <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
                          } else if (['doc', 'docx'].includes(extension || '')) {
                            return <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                          } else if (['xls', 'xlsx'].includes(extension || '')) {
                            return <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-green-700 flex-shrink-0" />
                          }
                          
                          return <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 flex-shrink-0" />
                        }
                        
                        return (
                          <div key={doc.id} className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-gray-300">
                            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                              {getFileIcon(doc.filename || doc.original_filename)}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs sm:text-sm text-gray-500 font-medium mb-1 sm:mb-0">
                                  {new Date(doc.upload_date || doc.created_at).toLocaleDateString('es-AR', { 
                                    day: '2-digit', 
                                    month: '2-digit',
                                    year: '2-digit'
                                  })}
                                </div>
                                {doc.file_size && (
                                  <div className="text-xs text-gray-400 font-medium sm:hidden">
                                    {(doc.file_size / 1024 / 1024).toFixed(1)}MB
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3">
                                {doc.file_size && (
                                  <div className="text-xs sm:text-sm text-gray-400 font-medium hidden sm:block">
                                    {(doc.file_size / 1024 / 1024).toFixed(1)}MB
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="px-3 py-2 h-8 hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-800 hover:border-gray-400 text-xs font-medium transition-colors duration-200"
                                    onClick={() => setPreviewDocument({...doc, section_name: section})}
                                  >
                                    <Eye className="h-3 w-3 sm:mr-1.5" />
                                    <span className="hidden sm:inline">Ver</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="px-3 py-2 h-8 bg-[#1B293F] hover:bg-[#1B293F]/90 text-white text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200"
                                    onClick={() => window.open(doc.file_url, '_blank')}
                                  >
                                    <Download className="h-3 w-3 sm:mr-1.5" />
                                    <span className="hidden sm:inline">Descargar</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchTerm.trim() ? (
                  <>
                    <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No se encontraron documentos que coincidan con "{searchTerm}"</p>
                    <p className="text-sm mt-2 text-gray-400">Intenta con otros términos de búsqueda</p>
                  </>
                ) : (
                  <>
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay documentos disponibles para este proyecto.</p>
                  </>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Modal de previsualización de documentos */}
      <Dialog open={!!previewDocument} onOpenChange={() => setPreviewDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {previewDocument?.section_name || 'Documento'}
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