'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Building, Users, Search, MapPin, Eye, TrendingUp, Clock, CheckCircle, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { PageHeader } from '@/components/page-header'
import { useWorkspace } from '@/components/workspace-context'
import { toast } from 'sonner'

// Importar tipos y componentes
import { Project, Client, ProjectStage, CreateProjectData, CreateClientData, mockProjectStages } from '@/lib/construction'
import { getStageColor } from '@/lib/construction-ui'
import { uploadProjectImage } from '@/lib/storage'
import ProjectDetail from './components/ProjectDetail'
import CreateProjectModal from './components/CreateProjectModal'
import ClientManagement from './components/ClientManagement'

export default function ConstruccionClientPage() {
  const [activeTab, setActiveTab] = useState('projects')
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projectStages] = useState<ProjectStage[]>(mockProjectStages)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStage, setFilterStage] = useState('all')
  const [filterClient, setFilterClient] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const workspace = useWorkspace()

  // Cargar datos reales desde las APIs
  useEffect(() => {
    loadClients()
    loadProjects()
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

  const handleCreateProject = async (projectData: CreateProjectData, imageFile?: File) => {
    try {
      setError(null)

      const response = await fetch('/api/workspace/construction/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear el proyecto')
      }

      const data = await response.json()
      let finalProject = data.project

      if (imageFile) {
        try {
          const imageUrl = await uploadProjectImage(finalProject.id, imageFile)

          const updateResponse = await fetch('/api/workspace/construction/projects', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: finalProject.id, cover_image_url: imageUrl }),
          })

          if (updateResponse.ok) {
            const updateData = await updateResponse.json()
            finalProject = updateData.project
          }
        } catch (imageError) {
          console.error('Error uploading image:', imageError)
          setError('Proyecto creado, pero hubo un error al subir la imagen')
        }
      }

      setProjects(prev => [finalProject, ...prev])

    } catch (error: any) {
      console.error('Error creating project:', error)
      setError(error.message || 'Error al crear el proyecto')
      throw error
    }
  }

  const handleCreateClient = async (clientData: CreateClientData) => {
    try {
      setError(null)

      const response = await fetch('/api/workspace/construction/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear el cliente')
      }

      const data = await response.json()
      setClients(prev => [data.client, ...prev])

    } catch (error: any) {
      console.error('Error creating client:', error)
      setError(error.message || 'Error al crear el cliente')
      throw error
    }
  }

  const handleUpdateClient = async (clientId: string, clientData: Partial<CreateClientData>) => {
    try {
      setError(null)

      const response = await fetch('/api/workspace/construction/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: clientId, ...clientData }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar el cliente')
      }

      const data = await response.json()
      setClients(prev => prev.map(client =>
        client.id === clientId ? data.client : client
      ))

    } catch (error: any) {
      console.error('Error updating client:', error)
      setError(error.message || 'Error al actualizar el cliente')
      throw error
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

      setClients(prev => prev.filter(client => client.id !== clientId))

    } catch (error: any) {
      console.error('Error deleting client:', error)
      setError(error.message || 'Error al eliminar el cliente')
      throw error
    }
  }

  const handleProjectStageChange = async (projectId: string, newStage: string) => {
    try {
      setError(null)

      const project = projects.find(p => p.id === projectId)
      if (!project) return

      const response = await fetch('/api/workspace/construction/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId, current_stage: newStage }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar el proyecto')
      }

      const data = await response.json()

      setProjects(prev => prev.map(project =>
        project.id === projectId ? data.project : project
      ))

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
      const updateData: any = { id: updatedProject.id }

      // Solo incluir campos que tienen valor definido
      const fields = [
        'enable_tax_management', 'projected_total_cost', 'name', 'address',
        'surface', 'budget', 'start_date', 'end_date', 'notes', 'current_stage',
        'permit_status', 'director_obra', 'profesionales', 'project_usage',
        'barrio', 'ciudad', 'inspector_name', 'architect', 'builder',
        'project_type', 'project_use', 'dgro_file_number', 'expedientes',
        'inhibition_report_file_url', 'inhibition_report_upload_date', 'inhibition_report_notes'
      ] as const

      for (const field of fields) {
        if ((updatedProject as any)[field] !== undefined) {
          updateData[field] = (updatedProject as any)[field]
        }
      }

      const response = await fetch('/api/workspace/construction/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        throw new Error(errorData.error || `Error ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      setProjects(prev => prev.map(project =>
        project.id === data.project.id ? data.project : project
      ))
      setSelectedProject(data.project)

    } catch (error: any) {
      console.error('Error updating project:', error)
      setError(`Error al actualizar el proyecto: ${error.message}`)

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

      const response = await fetch(`/api/workspace/construction/projects?id=${projectId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar el proyecto')
      }

      const data = await response.json()

      setProjects(prev => prev.filter(project => project.id !== projectId))

      if (selectedProject?.id === projectId) {
        setSelectedProject(null)
      }

      await loadProjects()
      toast.success(data.message || 'Proyecto eliminado exitosamente')

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
    <div className="flex-1 space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Construcción"
        description="Gestión integral de proyectos de construcción y gestoría municipal"
      />

      {/* Botón Nuevo Proyecto */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowCreateModal(true)}
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-destructive">&#9888;&#65039;</div>
              <div>
                <h3 className="font-semibold text-destructive">Error de conexión</h3>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas de resumen */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Proyectos</CardTitle>
            <Building className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalProjects}</div>
            <p className="text-xs text-primary">Cartera completa</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Gestoria</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{projectsInProgress}</div>
            <p className="text-xs text-emerald-500">En construcción activa</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En ejecución de obra</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{projectsInPermits}</div>
            <p className="text-xs text-yellow-500">Gestión en trámite</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Finalizados</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{projectsCompleted}</div>
            <p className="text-xs text-emerald-500">Obras terminadas</p>
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
            Clientes <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full ml-1">{clients.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          {/* Búsqueda y filtros */}
          <Card>
            <CardContent className="p-4 sm:p-6">
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
                    <SelectTrigger className="w-full sm:w-48">
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
                    <SelectTrigger className="w-full sm:w-48">
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
                    <div className="absolute top-3 right-3 z-10">
                      <Badge className={`${getStageColor(project.current_stage || '')} text-white`}>
                        {project.current_stage}
                      </Badge>
                    </div>
                    <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0 backdrop-blur-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setProjectToDelete(project)
                          setShowDeleteConfirm(true)
                        }}
                        title="Eliminar proyecto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-0" />
                  </div>

                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg leading-tight">{project.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {project.barrio && <span>{project.barrio}</span>}
                          {project.ciudad && <span>{project.ciudad}</span>}
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

      {/* Confirmación de eliminación */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Eliminar proyecto</DialogTitle>
            <DialogDescription>
              {projectToDelete ? (
                `¿Estás seguro de que quieres eliminar el proyecto "${projectToDelete.name}"? Esta acción no se puede deshacer y también se eliminarán los documentos asociados.`
              ) : (
                '¿Estás seguro de eliminar este proyecto?'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false)
                setProjectToDelete(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!projectToDelete) return
                await handleDeleteProject(projectToDelete.id)
                setShowDeleteConfirm(false)
                setProjectToDelete(null)
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
