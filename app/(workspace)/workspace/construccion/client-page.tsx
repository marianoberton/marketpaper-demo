'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Building, Users, Search, Filter, Calendar, MapPin, User, Eye, BarChart3, TrendingUp, Clock, CheckCircle, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { PageHeader } from '@/components/page-header'
import { useWorkspace } from '@/components/workspace-context'

// Importar tipos y componentes
import { Project, Client, ProjectStage, CreateProjectData, CreateClientData, mockProjectStages } from '@/lib/construction'
import { uploadProjectImage } from '@/lib/storage'
import ProjectDetail from './components/ProjectDetail'
import CreateProjectModal from './components/CreateProjectModal'
import ClientManagement from './components/ClientManagement'

// Mock data para proyectos (temporalmente hasta conectar con API)
const mockProjects: Project[] = [
  {
    id: '1',
    company_id: '1',
    name: 'LUJAN 2706',
    address: 'LUJAN 2706',
    barrio: 'Flores',
    ciudad: 'CABA',
    surface: 2107.00,
    director_obra: 'Arq. María González',
    builder: 'TABOADA CORA RAQUEL',
    status: 'En AVO 3',
    current_stage: 'AVO 3',
    cover_image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop',
    dgro_file_number: 'EX-2021-18038149-GCABA-DGROC',
    project_type: 'Obra Mayor',
    project_usage: 'Vivienda',
    permit_status: 'Aprobado',
    client_id: '1',
    start_date: '2024-01-15',
    end_date: '2024-12-15',
    budget: 8500000,
    profesionales: [
      { name: 'Ing. Carlos López', role: 'Estructuralista' },
      { name: 'Ing. Ana García', role: 'Instalación Electrica' }
    ],
    // Compatibilidad temporal
    architect: 'Arq. María González',
    project_use: 'OBRA MAYOR',
    inspector_name: 'Ing. Carlos López',
    notes: 'Proyecto de ampliación con modificaciones estructurales importantes.',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    company_id: '1',
    name: 'TORRE PALERMO',
    address: 'Av. Santa Fe 3456',
    barrio: 'Palermo',
    ciudad: 'CABA',
    surface: 4500.00,
    director_obra: 'Arq. Roberto Silva',
    builder: 'DESARROLLOS URBANOS SA',
    status: 'En Gestoria',
    current_stage: 'Permiso de obra',
    cover_image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
    dgro_file_number: 'EX-2024-22345678-GCABA-DGROC',
    project_type: 'Obra Mayor',
    project_usage: 'Vivienda',
    permit_status: 'En trámite',
    client_id: '2',
    start_date: '2024-06-01',
    end_date: '2025-12-31',
    budget: 25000000,
    profesionales: [
      { name: 'Ing. Ana Martínez', role: 'Estructuralista' },
      { name: 'Ing. Pedro Ruiz', role: 'Instalación Sanitaria' },
      { name: 'Téc. Luis Castro', role: 'Instalación Electrica' }
    ],
    // Compatibilidad temporal
    architect: 'Arq. Roberto Silva',
    project_use: 'RESIDENCIAL',
    inspector_name: 'Ing. Ana Martínez',
    notes: 'Torre residencial de 15 pisos con cocheras subterráneas.',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z'
  },
  {
    id: '3',
    company_id: '1',
    name: 'COMPLEJO BELGRANO',
    address: 'Av. Cabildo 2789',
    barrio: 'Belgrano',
    ciudad: 'CABA',
    surface: 3200.00,
    director_obra: 'Arq. Laura Fernández',
    builder: 'TABOADA CORA RAQUEL',
    status: 'Finalización',
    current_stage: 'Conforme de obra',
    cover_image_url: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=400&h=300&fit=crop',
    dgro_file_number: 'EX-2023-15555444-GCABA-DGROC',
    project_type: 'Obra Media',
    project_usage: 'Mixto',
    permit_status: 'Aprobado',
    client_id: '1',
    start_date: '2023-03-01',
    end_date: '2024-02-29',
    budget: 18000000,
    profesionales: [
      { name: 'Ing. Miguel Torres', role: 'Estructuralista' },
      { name: 'Arq. Sofia Morales', role: 'Proyectista' },
      { name: 'Ing. Roberto Díaz', role: 'Instalación e incendios' }
    ],
    // Compatibilidad temporal
    architect: 'Arq. Laura Fernández',
    project_use: 'MIXTO',
    inspector_name: 'Ing. Miguel Torres',
    notes: 'Complejo de oficinas y locales comerciales. Obra completada satisfactoriamente.',
    created_at: '2023-03-01T10:00:00Z',
    updated_at: '2024-02-29T10:00:00Z'
  }
]

export default function ConstruccionClientPage() {
  const [activeTab, setActiveTab] = useState('projects')
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projectStages] = useState<ProjectStage[]>(mockProjectStages)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStage, setFilterStage] = useState('all')
  const [filterClient, setFilterClient] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const workspace = useWorkspace()

  // Cargar datos reales desde las APIs
  useEffect(() => {
    // Temporalmente usar datos mock para testing
    setProjects(mockProjects)
    setLoading(false)
    // loadClients()
    // loadProjects()
  }, [])

  const loadClients = async () => {
    try {
      setError(null)
      
      const url = workspace.companyId 
        ? `/api/workspace/construction/clients?company_id=${workspace.companyId}`
        : '/api/workspace/construction/clients'
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Error al cargar los clientes')
      }
      
      const data = await response.json()
      setClients(data.clients || [])
    } catch (error) {
      console.error('Error loading clients:', error)
      setError('Error al cargar los clientes')
    }
  }

  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = workspace.companyId 
        ? `/api/workspace/construction/projects?company_id=${workspace.companyId}`
        : '/api/workspace/construction/projects'
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Error al cargar los proyectos')
      }
      
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Error loading projects:', error)
      setError('Error al cargar los proyectos')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar proyectos
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.dgro_file_number?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStage = filterStage === 'all' || project.current_stage === filterStage
    const matchesClient = filterClient === 'all' || project.client_id === filterClient

    return matchesSearch && matchesStage && matchesClient
  })

  // Calcular estadísticas con nuevas etapas
  const totalProjects = projects.length
  const projectsInProgress = projects.filter(p => 
    p.current_stage && !['Conforme de obra', 'MH-SUBDIVISION'].includes(p.current_stage)
  ).length
  const projectsInPermits = projects.filter(p => 
    ['Consulta DGIUR', 'Registro etapa de proyecto', 'Permiso de obra'].includes(p.current_stage || '')
  ).length
  const projectsCompleted = projects.filter(p => 
    ['Conforme de obra', 'MH-SUBDIVISION'].includes(p.current_stage || '')
  ).length

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

  const handleCreateProject = async (projectData: CreateProjectData, imageFile?: File) => {
    try {
      setError(null)
      
      // Primero crear el proyecto sin imagen
      const response = await fetch('/api/workspace/construction/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear el proyecto')
      }

      const data = await response.json()
      let finalProject = data.project

      // Si hay una imagen, subirla y actualizar el proyecto
      if (imageFile) {
        try {
          const imageUrl = await uploadProjectImage(finalProject.id, imageFile)
          
          // Actualizar el proyecto con la URL de la imagen
          const updateResponse = await fetch('/api/workspace/construction/projects', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: finalProject.id,
              cover_image_url: imageUrl
            }),
          })

          if (updateResponse.ok) {
            const updateData = await updateResponse.json()
            finalProject = updateData.project
          }
        } catch (imageError) {
          console.error('Error uploading image:', imageError)
          // No fallar la creación del proyecto por error de imagen
          setError('Proyecto creado, pero hubo un error al subir la imagen')
        }
      }
      
      // Agregar el nuevo proyecto a la lista
      setProjects(prev => [finalProject, ...prev])
      
    } catch (error: any) {
      console.error('Error creating project:', error)
      setError(error.message || 'Error al crear el proyecto')
      throw error // Re-lanzar el error para que el componente lo maneje
    }
  }

  const handleCreateClient = async (clientData: CreateClientData) => {
    try {
      setError(null)
      
      const response = await fetch('/api/workspace/construction/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear el cliente')
      }

      const data = await response.json()
      
      // Agregar el nuevo cliente a la lista
      setClients(prev => [data.client, ...prev])
      
    } catch (error: any) {
      console.error('Error creating client:', error)
      setError(error.message || 'Error al crear el cliente')
      throw error // Re-lanzar el error para que el componente lo maneje
    }
  }

  const handleUpdateClient = async (clientId: string, clientData: Partial<CreateClientData>) => {
    try {
      setError(null)
      
      const response = await fetch('/api/workspace/construction/clients', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: clientId, ...clientData }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar el cliente')
      }

      const data = await response.json()
      
      // Actualizar el cliente en la lista
      setClients(prev => prev.map(client => 
        client.id === clientId ? data.client : client
      ))
      
    } catch (error: any) {
      console.error('Error updating client:', error)
      setError(error.message || 'Error al actualizar el cliente')
      throw error // Re-lanzar el error para que el componente lo maneje
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/workspace/construction/clients?id=${clientId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar el cliente')
      }
      
      // Remover el cliente de la lista
      setClients(prev => prev.filter(client => client.id !== clientId))
      
    } catch (error: any) {
      console.error('Error deleting client:', error)
      setError(error.message || 'Error al eliminar el cliente')
      throw error // Re-lanzar el error para que el componente lo maneje
    }
  }

  const handleProjectStageChange = async (projectId: string, newStage: string) => {
    try {
      setError(null)
      
      const project = projects.find(p => p.id === projectId)
      if (!project) return
      
      const response = await fetch('/api/workspace/construction/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: projectId,
          current_stage: newStage
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar el proyecto')
      }

      const data = await response.json()
      
      // Actualizar la lista de proyectos
      setProjects(prev => prev.map(project => 
        project.id === projectId ? data.project : project
      ))
      
      // Actualizar proyecto seleccionado si es el mismo
      if (selectedProject?.id === projectId) {
        setSelectedProject(data.project)
      }
      
    } catch (error: any) {
      console.error('Error updating project stage:', error)
      setError(error.message || 'Error al actualizar la etapa del proyecto')
    }
  }

  const handleProjectUpdate = async (updatedProject: Project) => {
    try {
      console.log('Updating project:', updatedProject.id, 'with data:', {
        enable_tax_management: updatedProject.enable_tax_management,
        projected_total_cost: updatedProject.projected_total_cost
      })

      // Preparar solo los campos que pueden haber cambiado, filtrando valores undefined
      const updateData: any = {
        id: updatedProject.id
      }

      // Solo incluir campos que tienen valor definido
      if (updatedProject.enable_tax_management !== undefined) {
        updateData.enable_tax_management = updatedProject.enable_tax_management
      }
      if (updatedProject.projected_total_cost !== undefined) {
        updateData.projected_total_cost = updatedProject.projected_total_cost
      }
      if (updatedProject.name !== undefined) {
        updateData.name = updatedProject.name
      }
      if (updatedProject.address !== undefined) {
        updateData.address = updatedProject.address
      }
      if (updatedProject.surface !== undefined) {
        updateData.surface = updatedProject.surface
      }
      if (updatedProject.budget !== undefined) {
        updateData.budget = updatedProject.budget
      }
      if (updatedProject.start_date !== undefined) {
        updateData.start_date = updatedProject.start_date
      }
      if (updatedProject.end_date !== undefined) {
        updateData.end_date = updatedProject.end_date
      }
      if (updatedProject.notes !== undefined) {
        updateData.notes = updatedProject.notes
      }
      if (updatedProject.current_stage !== undefined) {
        updateData.current_stage = updatedProject.current_stage
      }
      if (updatedProject.permit_status !== undefined) {
        updateData.permit_status = updatedProject.permit_status
      }
      // Nuevos campos
      if (updatedProject.director_obra !== undefined) {
        updateData.director_obra = updatedProject.director_obra
      }
      if (updatedProject.profesionales !== undefined) {
        updateData.profesionales = updatedProject.profesionales
      }
      if (updatedProject.project_usage !== undefined) {
        updateData.project_usage = updatedProject.project_usage
      }
      if (updatedProject.barrio !== undefined) {
        updateData.barrio = updatedProject.barrio
      }
      if (updatedProject.ciudad !== undefined) {
        updateData.ciudad = updatedProject.ciudad
      }
      
      // Campos de compatibilidad temporal
      if (updatedProject.inspector_name !== undefined) {
        updateData.inspector_name = updatedProject.inspector_name
      }
      if (updatedProject.architect !== undefined) {
        updateData.architect = updatedProject.architect
      }
      if (updatedProject.builder !== undefined) {
        updateData.builder = updatedProject.builder
      }
      if (updatedProject.project_type !== undefined) {
        updateData.project_type = updatedProject.project_type
      }
      if (updatedProject.project_use !== undefined) {
        updateData.project_use = updatedProject.project_use
      }
      if (updatedProject.dgro_file_number !== undefined) {
        updateData.dgro_file_number = updatedProject.dgro_file_number
      }
      if (updatedProject.expedientes !== undefined) {
        updateData.expedientes = updatedProject.expedientes
      }

      console.log('Sending update data:', updateData)

      // Persistir cambios en la base de datos
      const response = await fetch('/api/workspace/construction/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response error:', errorText)
        
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        
        throw new Error(errorData.error || `Error ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log('Update response:', data)
      
      // Actualizar la lista de proyectos con los datos del servidor
      setProjects(prev => prev.map(project => 
        project.id === data.project.id ? data.project : project
      ))
      
      // Actualizar proyecto seleccionado
      setSelectedProject(data.project)
      
    } catch (error: any) {
      console.error('Error updating project:', error)
      setError(`Error al actualizar el proyecto: ${error.message}`)
      
      // Aún así actualizar el estado local temporalmente
      setProjects(prev => prev.map(project => 
        project.id === updatedProject.id ? updatedProject : project
      ))
      setSelectedProject(updatedProject)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      setError(null)
      
      const project = projects.find(p => p.id === projectId)
      if (!project) return
      
      // Confirmación antes de eliminar
      const confirmed = window.confirm(
        `¿Estás seguro de que quieres eliminar el proyecto "${project.name}"?\n\n` +
        'Esta acción no se puede deshacer. Se eliminarán también todos los documentos asociados.'
      )
      
      if (!confirmed) return
      
      const response = await fetch(`/api/workspace/construction/projects?id=${projectId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar el proyecto')
      }
      
      const data = await response.json()
      
      // Remover el proyecto de la lista
      setProjects(prev => prev.filter(project => project.id !== projectId))
      
      // Si era el proyecto seleccionado, volver a la lista
      if (selectedProject?.id === projectId) {
        setSelectedProject(null)
      }
      
      // Mostrar mensaje de éxito
      alert(data.message || 'Proyecto eliminado exitosamente')
      
    } catch (error: any) {
      console.error('Error deleting project:', error)
      setError(error.message || 'Error al eliminar el proyecto')
    }
  }

  // Vista de detalle de proyecto
  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onStageChange={handleProjectStageChange}
        onProjectUpdate={handleProjectUpdate}
        onDeleteProject={handleDeleteProject}
      />
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header Profesional */}
      <PageHeader
        title="Construcción"
        description="Gestión integral de proyectos de construcción y gestoría municipal"
        accentColor="blue"
      />
      
      {/* Botón Nuevo Proyecto */}
      <div className="flex justify-end">
        <Button 
          onClick={() => setShowCreateModal(true)} 
          size="lg" 
          className="bg-gradient-to-r from-brilliant-blue to-plum hover:from-brilliant-blue/90 hover:to-plum/90 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-red-600">⚠️</div>
              <div>
                <h3 className="font-semibold text-red-900">Error de conexión</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas de resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Proyectos</CardTitle>
            <Building className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalProjects}</div>
            <p className="text-xs text-blue-600">Cartera completa</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Permisos de Gestoria</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{projectsInProgress}</div>
            <p className="text-xs text-green-600">En construcción activa</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">En ejecución de obra</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{projectsInPermits}</div>
            <p className="text-xs text-yellow-600">Gestión en trámite</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Finalizados</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{projectsCompleted}</div>
            <p className="text-xs text-emerald-600">Obras terminadas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Proyectos
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded-full ml-1">{clients.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          {/* Búsqueda y filtros */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nombre, dirección o N° expediente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={filterStage} onValueChange={setFilterStage}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Todas las etapas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las etapas</SelectItem>
                      {projectStages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.name}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterClient} onValueChange={setFilterClient}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Todos los clientes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los clientes</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid de proyectos */}
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={project.cover_image_url || '/placeholder-project.jpg'}
                      alt={project.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className={`${getStageColor(project.current_stage || '')} text-white`}>
                        {project.current_stage}
                      </Badge>
                    </div>
                    <div className="absolute top-3 left-3">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0 bg-red-600/80 hover:bg-red-700 backdrop-blur-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteProject(project.id)
                        }}
                        title="Eliminar proyecto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg leading-tight">{project.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {project.barrio && (
                            <span>{project.barrio}</span>
                          )}
                          {project.ciudad && (
                            <span>{project.ciudad}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{project.address}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Superficie: <span className="font-medium">{project.surface?.toLocaleString()} m²</span>
                          </span>
                        </div>
                        
                        <div className="pt-2">
                          <p className="font-medium text-sm">{project.builder}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <div className="px-6 pb-6">
                    <Button 
                      className="w-full" 
                      onClick={() => setSelectedProject(project)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalle
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron proyectos</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || filterStage !== 'all' || filterClient !== 'all' 
                    ? 'Intenta ajustar los filtros de búsqueda' 
                    : 'Comienza creando tu primer proyecto de construcción'
                  }
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Proyecto
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="clients">
          <ClientManagement 
            clients={clients}
            onCreateClient={handleCreateClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de creación */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
        clients={clients}
        projectStages={projectStages}
      />
    </div>
  )
}
