'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Building, Users, Search, Filter, Calendar, MapPin, User, Eye, BarChart3, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import Image from 'next/image'

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
    address: 'LUJAN 2706, CABA',
    surface: 2107.00,
    architect: 'Arq. María González',
    builder: 'TABOADA CORA RAQUEL',
    status: 'En AVO 3',
    current_stage: 'AVO 3',
    cover_image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop',
    dgro_file_number: 'EX-2021-18038149-GCABA-DGROC',
    project_type: 'MODIFICACION Y/O AMPLIACION',
    project_use: 'OBRA MAYOR',
    permit_status: 'Aprobado',
    client_id: '1',
    start_date: '2024-01-15',
    end_date: '2024-12-15',
    budget: 8500000,
    inspector_name: 'Ing. Carlos López',
    notes: 'Proyecto de ampliación con modificaciones estructurales importantes.',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    company_id: '1',
    name: 'TORRE PALERMO',
    address: 'Av. Santa Fe 3456, CABA',
    surface: 4500.00,
    architect: 'Arq. Roberto Silva',
    builder: 'DESARROLLOS URBANOS SA',
    status: 'En Permisos',
    current_stage: 'Permisos',
    cover_image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
    dgro_file_number: 'EX-2024-22345678-GCABA-DGROC',
    project_type: 'OBRA NUEVA',
    project_use: 'RESIDENCIAL',
    permit_status: 'En trámite',
    client_id: '2',
    start_date: '2024-06-01',
    end_date: '2025-12-31',
    budget: 25000000,
    inspector_name: 'Ing. Ana Martínez',
    notes: 'Torre residencial de 15 pisos con cocheras subterráneas.',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z'
  },
  {
    id: '3',
    company_id: '1',
    name: 'COMPLEJO BELGRANO',
    address: 'Av. Cabildo 2789, CABA',
    surface: 3200.00,
    architect: 'Arq. Laura Fernández',
    builder: 'TABOADA CORA RAQUEL',
    status: 'Finalización',
    current_stage: 'Finalización',
    cover_image_url: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=400&h=300&fit=crop',
    dgro_file_number: 'EX-2023-15555444-GCABA-DGROC',
    project_type: 'OBRA NUEVA',
    project_use: 'MIXTO',
    permit_status: 'Aprobado',
    client_id: '1',
    start_date: '2023-03-01',
    end_date: '2024-02-29',
    budget: 18000000,
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

  // Cargar datos reales desde las APIs
  useEffect(() => {
    loadClients()
    loadProjects()
  }, [])

  const loadClients = async () => {
    try {
      setError(null)
      
      const response = await fetch('/api/workspace/construction/clients')
      
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
      
      const response = await fetch('/api/workspace/construction/projects')
      
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

  // Calcular estadísticas
  const totalProjects = projects.length
  const projectsInProgress = projects.filter(p => 
    p.current_stage && !['Finalización', 'Paralización'].includes(p.current_stage)
  ).length
  const projectsInPermits = projects.filter(p => p.current_stage === 'Permisos').length
  const projectsCompleted = projects.filter(p => p.current_stage === 'Finalización').length

  const getStageColor = (stage: string) => {
    const stageColors: Record<string, string> = {
      'Planificación': 'bg-gray-500',
      'Permisos': 'bg-yellow-500',
      'Demolición': 'bg-red-500',
      'Excavación 10%': 'bg-purple-500',
      'Excavación 50%': 'bg-purple-600',
      'AVO 1': 'bg-green-500',
      'AVO 2': 'bg-green-600',
      'AVO 3': 'bg-green-700',
      'AVO 4': 'bg-green-800',
      'Paralización': 'bg-orange-500',
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

  const handleProjectUpdate = (updatedProject: Project) => {
    // Actualizar la lista de proyectos
    setProjects(prev => prev.map(project => 
      project.id === updatedProject.id ? updatedProject : project
    ))
    
    // Actualizar proyecto seleccionado
    setSelectedProject(updatedProject)
  }

  // Vista de detalle de proyecto
  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onStageChange={handleProjectStageChange}
        onProjectUpdate={handleProjectUpdate}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto px-6 py-6 space-y-6">
        {/* Mostrar errores si los hay */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Header principal mejorado */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Construcción</h1>
              <p className="text-gray-600 mt-1">
                Gestión integral de proyectos de construcción y gestoría municipal
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)} size="lg" className="shadow-md">
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Proyecto
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Proyectos
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clientes {loading ? '(Cargando...)' : `(${clients.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            {/* Estadísticas principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Proyectos</p>
                      <h3 className="text-3xl font-bold text-blue-600">{totalProjects}</h3>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">En Obra</p>
                      <h3 className="text-3xl font-bold text-green-600">{projectsInProgress}</h3>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">En Permisos</p>
                      <h3 className="text-3xl font-bold text-yellow-600">{projectsInPermits}</h3>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Finalizados</p>
                      <h3 className="text-3xl font-bold text-emerald-600">{projectsCompleted}</h3>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-full">
                      <CheckCircle className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg leading-tight">{project.name}</h3>
                          <p className="text-sm text-muted-foreground">{project.dgro_file_number}</p>
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
                          
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{project.architect}</span>
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
    </div>
  )
}
