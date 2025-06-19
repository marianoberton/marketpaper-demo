'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Image as ImageIcon
} from 'lucide-react'
import Image from 'next/image'
import { Project, mockProjectStages } from '@/lib/construction'
import { uploadProjectImage } from '@/lib/storage'

interface ProjectDetailProps {
  project: Project
  onBack: () => void
  onStageChange: (projectId: string, newStage: string) => void
  onProjectUpdate?: (updatedProject: Project) => void
}

// Verificaciones con opciones de carga de documentos
const verificationRequests = [
  { name: 'Demolición', required: false },
  { name: 'Demolición final', required: false },
  { name: 'Inicio de obra', required: false },
  { name: 'Excavación al 10%', required: false },
  { name: 'Excavación al 50%', required: false },
  { name: 'AVO 1', required: true },
  { name: 'AVO 2', required: true },
  { name: 'AVO 3', required: true },
  { name: 'AVO 4', required: false }
]



// Etapas más compactas
const projectPhases = [
  {
    name: 'Planificación',
    stages: ['Planificación']
  },
  {
    name: 'Permisos',
    stages: ['Permisos']
  },
  {
    name: 'Construcción',
    stages: ['AVO 1', 'AVO 2', 'AVO 3', 'AVO 4', 'Finalización']
  },
  {
    name: 'Especiales',
    stages: ['Paralización']
  }
]

// Mock documents para mostrar en la vista unificada
const mockDocuments = [
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

export default function ProjectDetail({ project, onBack, onStageChange, onProjectUpdate }: ProjectDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedProject, setEditedProject] = useState(project)
  const [documents, setDocuments] = useState(mockDocuments)
  const [uploadingTo, setUploadingTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tableExists, setTableExists] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    setEditedProject(project)
    loadProjectDocuments()
  }, [project])

  const loadProjectDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/workspace/construction/documents?projectId=${project.id}`)
      
      if (response.ok) {
        const apiDocuments = await response.json()
        setTableExists(true)
        // Convertir formato API a formato del componente
        const formattedDocuments = apiDocuments.map((doc: any) => ({
          id: doc.id,
          name: doc.original_filename,
          section: doc.section_name,
          uploadDate: new Date(doc.created_at).toISOString().split('T')[0],
          size: `${(doc.file_size / 1024 / 1024).toFixed(1)} MB`,
          type: doc.mime_type.includes('pdf') ? 'pdf' : 'image',
          url: doc.file_url
        }))
        setDocuments(formattedDocuments)
      } else {
        const errorData = await response.json()
        if (errorData.error && errorData.error.includes('project_documents')) {
          setTableExists(false)
          console.error('project_documents table does not exist - using mock data')
        } else if (errorData.error && errorData.error.includes('estructura correcta')) {
          setTableExists(false)
          console.error('project_documents table has wrong structure - using mock data')
        }
        // Mantener documentos mock en caso de error
        setDocuments(mockDocuments)
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      // Mantener documentos mock en caso de error
      setDocuments(mockDocuments)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // TODO: Implementar guardado del proyecto editado
    setIsEditing(false)
  }

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true)
      
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        alert('El archivo debe ser una imagen')
        return
      }
      
      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('La imagen no debe superar los 10MB')
        return
      }
      
      // Subir imagen
      const imageUrl = await uploadProjectImage(project.id, file)
      
      // Actualizar proyecto con la nueva imagen
      const response = await fetch('/api/workspace/construction/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: project.id,
          cover_image_url: imageUrl
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
      console.error('Error uploading image:', error)
      alert('Error al subir la imagen. Por favor, inténtalo de nuevo.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleFileUpload = async (file: File, section: string) => {
    try {
      setUploading(true)
      setUploadingTo(null)
      
      // Crear FormData para enviar al API
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', project.id)
      formData.append('sectionName', section)
      formData.append('description', `Documento de ${section}`)

      // Enviar al API
      const response = await fetch('/api/workspace/construction/documents', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        let errorMessage = 'Error al subir el archivo'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          // Si no se puede parsear como JSON, usar el status text
          errorMessage = `Error ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      // Agregar documento a la lista
      const newDocument = {
        id: result.id || Date.now().toString(),
        name: file.name,
        section: section,
        uploadDate: new Date().toISOString().split('T')[0],
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        type: file.type.includes('pdf') ? 'pdf' : 'image',
        url: result.file_url
      }
      
      setDocuments(prev => [...prev, newDocument])
      
      // Mostrar mensaje de éxito
      alert(`Documento "${file.name}" cargado exitosamente`)
      
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Error al subir el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = (documentId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este documento?')) {
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      // TODO: Implementar eliminación real del servidor
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
      'Planificación': 'bg-gray-500',
      'Permisos': 'bg-yellow-500',
      'AVO 1': 'bg-green-500',
      'AVO 2': 'bg-green-600',
      'AVO 3': 'bg-green-700',
      'AVO 4': 'bg-green-800',
      'Paralización': 'bg-orange-500',
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

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
              <Button 
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? "outline" : "default"}
                size="lg"
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? 'Cancelar' : 'Editar'}
              </Button>
              {isEditing && (
                <Button onClick={handleSave} size="lg">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Layout principal mejorado - cambiado a 5 columnas para mejor distribución */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Columna principal - Información del proyecto */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Información general con imagen */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Datos del proyecto */}
            <div className="lg:col-span-2">
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
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">N° expediente DGROC</Label>
                        {isEditing ? (
                          <Input
                            value={editedProject.dgro_file_number || ''}
                            onChange={(e) => setEditedProject(prev => ({
                              ...prev,
                              dgro_file_number: e.target.value
                            }))}
                            className="mt-1"
                          />
                        ) : (
                          <p className="font-semibold text-lg">{project.dgro_file_number}</p>
                        )}
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
                              <SelectItem value="OBRA NUEVA">OBRA NUEVA</SelectItem>
                              <SelectItem value="MODIFICACION Y/O AMPLIACION">MODIFICACIÓN Y/O AMPLIACIÓN</SelectItem>
                              <SelectItem value="REFACCION">REFACCIÓN</SelectItem>
                              <SelectItem value="DEMOLICION">DEMOLICIÓN</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="font-semibold">{project.project_type}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Tipo de permiso</Label>
                        {isEditing ? (
                          <Select
                            value={editedProject.project_use || ''}
                            onValueChange={(value) => setEditedProject(prev => ({
                              ...prev,
                              project_use: value
                            }))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="RESIDENCIAL">RESIDENCIAL</SelectItem>
                              <SelectItem value="COMERCIAL">COMERCIAL</SelectItem>
                              <SelectItem value="INDUSTRIAL">INDUSTRIAL</SelectItem>
                              <SelectItem value="MIXTO">MIXTO</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="font-semibold">{project.project_use}</p>
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
            </div>

            {/* Imagen del proyecto */}
            <div>
              <Card className="h-full">
                <CardContent className="p-0">
                  <div className="relative h-80 rounded-lg overflow-hidden bg-gray-100">
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
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="font-bold text-lg">{editedProject.name}</h3>
                      <p className="text-sm opacity-90">{editedProject.address}</p>
                    </div>
                    
                    {/* Botón para editar imagen */}
                    <div className="absolute top-4 right-4">
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
          </div>

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

          {/* Pedidos de verificaciones con carga de documentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Pedidos de Verificaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {verificationRequests.map((request, index) => (
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
                          
                          {/* Botones para ver y descargar documentos de verificación */}
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
                              </div>
                            ))}
                          </div>
                          
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              id={`verification-${index}`}
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
                              onClick={() => document.getElementById(`verification-${index}`)?.click()}
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
                              id={`verification-${index}`}
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
                              onClick={() => document.getElementById(`verification-${index}`)?.click()}
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
            </CardContent>
          </Card>

          {/* Documentación del Proyecto - Vista unificada */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentación del Proyecto
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
                    <SelectItem value="Pagos y Comprobantes">Pagos</SelectItem>
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
                    La tabla 'project_documents' no existe o no tiene la estructura correcta. 
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
                  <p>No hay documentos cargados</p>
                  <p className="text-sm">Selecciona una sección y carga tus primeros documentos</p>
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
                                <h4 className="font-medium text-sm">{doc.name}</h4>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>{doc.uploadDate}</span>
                                  <span>{doc.size}</span>
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
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
        </div>

        {/* Sidebar derecho */}
        <div className="xl:col-span-1 space-y-6">
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