'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { X, Building, MapPin, User, Calendar, DollarSign, FileText, Settings, Upload, Image as ImageIcon } from 'lucide-react'
import { Client, ProjectStage, CreateProjectData } from '@/lib/construction'
import { uploadProjectImage } from '@/lib/storage'
import Image from 'next/image'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (projectData: CreateProjectData, imageFile?: File) => Promise<void>
  clients: Client[]
  projectStages: ProjectStage[]
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit,
  clients,
  projectStages
}: CreateProjectModalProps) {
  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    address: '',
    surface: undefined,
    architect: '',
    builder: '',
    client_id: '',
    start_date: '',
    end_date: '',
    budget: undefined,
    current_stage: 'Planificación',
    permit_status: 'Pendiente',
    inspector_name: '',
    notes: '',
    dgro_file_number: '',
    project_type: '',
    project_use: '',
    cover_image_url: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del proyecto es obligatorio'
    }
    
    if (!formData.address?.trim()) {
      newErrors.address = 'La dirección es obligatoria'
    }
    
    if (!formData.client_id) {
      newErrors.client_id = 'Debe seleccionar un cliente'
    }
    
    if (formData.surface && formData.surface <= 0) {
      newErrors.surface = 'La superficie debe ser mayor a 0'
    }
    
    if (formData.budget && formData.budget <= 0) {
      newErrors.budget = 'El presupuesto debe ser mayor a 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'El archivo debe ser una imagen' }))
        return
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'La imagen no debe superar los 5MB' }))
        return
      }
      
      setSelectedImage(file)
      
      // Crear preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      // Limpiar error si había
      if (errors.image) {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors.image
          return newErrors
        })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      // Primero crear el proyecto sin imagen
      const projectWithoutImage = { ...formData }
      delete projectWithoutImage.cover_image_url
      
      // Crear el proyecto con la imagen si existe
      await onSubmit(projectWithoutImage, selectedImage || undefined)
      
      // Reset form
      setFormData({
        name: '',
        address: '',
        surface: undefined,
        architect: '',
        builder: '',
        client_id: '',
        start_date: '',
        end_date: '',
        budget: undefined,
        current_stage: 'Planificación',
        permit_status: 'Pendiente',
        inspector_name: '',
        notes: '',
        dgro_file_number: '',
        project_type: '',
        project_use: '',
        cover_image_url: ''
      })
      setSelectedImage(null)
      setImagePreview('')
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof CreateProjectData, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      address: '',
      surface: undefined,
      architect: '',
      builder: '',
      client_id: '',
      start_date: '',
      end_date: '',
      budget: undefined,
      current_stage: 'Planificación',
      permit_status: 'Pendiente',
      inspector_name: '',
      notes: '',
      dgro_file_number: '',
      project_type: '',
      project_use: '',
      cover_image_url: ''
    })
    setSelectedImage(null)
    setImagePreview('')
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-white border-b z-10">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Crear Nuevo Proyecto</h2>
                <p className="text-sm text-muted-foreground">Complete la información del proyecto de construcción</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información básica */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Building className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Información Básica</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="name">
                    Nombre del Proyecto <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ej: Edificio Residencial Palermo"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">
                    Dirección <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Ej: Av. Santa Fe 1234, CABA"
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
                </div>

                <div>
                  <Label htmlFor="surface">Superficie (m²)</Label>
                  <Input
                    id="surface"
                    type="number"
                    value={formData.surface || ''}
                    onChange={(e) => handleInputChange('surface', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="120"
                    className={errors.surface ? 'border-red-500' : ''}
                  />
                  {errors.surface && <p className="text-sm text-red-500 mt-1">{errors.surface}</p>}
                </div>

                <div>
                  <Label htmlFor="client">
                    Cliente <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.client_id || ''}
                    onValueChange={(value) => handleInputChange('client_id', value)}
                  >
                    <SelectTrigger className={errors.client_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.client_id && <p className="text-sm text-red-500 mt-1">{errors.client_id}</p>}
                </div>
              </div>
            </div>

            {/* Imagen del proyecto */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Imagen del Proyecto</h3>
              </div>
              
              <div className="space-y-4">
                <Label htmlFor="project-image">Imagen de portada (opcional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <div className="relative w-full h-48 rounded-lg overflow-hidden">
                        <Image
                          src={imagePreview}
                          alt="Vista previa"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setSelectedImage(null)
                            setImagePreview('')
                            const input = document.getElementById('project-image') as HTMLInputElement
                            if (input) input.value = ''
                          }}
                        >
                          Cambiar imagen
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <Label htmlFor="project-image" className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-500 font-medium">
                            Seleccionar imagen
                          </span>
                          <span className="text-gray-500"> o arrastrar aquí</span>
                        </Label>
                        <Input
                          id="project-image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG, GIF hasta 5MB
                      </p>
                    </div>
                  )}
                </div>
                {errors.image && <p className="text-sm text-red-500">{errors.image}</p>}
              </div>
            </div>

            <Separator />

            {/* Información básica */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Building className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Información Básica</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="current_stage">Etapa Inicial</Label>
                  <Select 
                    value={formData.current_stage} 
                    onValueChange={(value) => handleInputChange('current_stage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectStages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.name}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Detalles técnicos */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Detalles Técnicos</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Presupuesto ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget || ''}
                    onChange={(e) => handleInputChange('budget', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Ej: 5000000"
                    className={errors.budget ? 'border-red-500' : ''}
                  />
                  {errors.budget && <p className="text-sm text-red-500 mt-1">{errors.budget}</p>}
                </div>

                <div>
                  <Label htmlFor="project_type">Tipo de Obra</Label>
                  <Select 
                    value={formData.project_type} 
                    onValueChange={(value) => handleInputChange('project_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OBRA NUEVA">Obra Nueva</SelectItem>
                      <SelectItem value="MODIFICACION Y/O AMPLIACION">Modificación y/o Ampliación</SelectItem>
                      <SelectItem value="DEMOLICION">Demolición</SelectItem>
                      <SelectItem value="REPARACION">Reparación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="project_use">Tipo de Permiso</Label>
                  <Select 
                    value={formData.project_use} 
                    onValueChange={(value) => handleInputChange('project_use', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar uso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OBRA MAYOR">Obra Mayor</SelectItem>
                      <SelectItem value="OBRA MENOR">Obra Menor</SelectItem>
                      <SelectItem value="RESIDENCIAL">Residencial</SelectItem>
                      <SelectItem value="COMERCIAL">Comercial</SelectItem>
                      <SelectItem value="INDUSTRIAL">Industrial</SelectItem>
                      <SelectItem value="MIXTO">Mixto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Información profesional */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Profesionales</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="architect">Arquitecto Responsable</Label>
                  <Input
                    id="architect"
                    value={formData.architect}
                    onChange={(e) => handleInputChange('architect', e.target.value)}
                    placeholder="Nombre del arquitecto"
                  />
                </div>

                <div>
                  <Label htmlFor="builder">Constructora</Label>
                  <Input
                    id="builder"
                    value={formData.builder}
                    onChange={(e) => handleInputChange('builder', e.target.value)}
                    placeholder="Nombre de la constructora"
                  />
                </div>

                <div>
                  <Label htmlFor="inspector_name">Inspector Asignado</Label>
                  <Input
                    id="inspector_name"
                    value={formData.inspector_name}
                    onChange={(e) => handleInputChange('inspector_name', e.target.value)}
                    placeholder="Nombre del inspector"
                  />
                </div>

                <div>
                  <Label htmlFor="permit_status">Estado del Permiso</Label>
                  <Select 
                    value={formData.permit_status} 
                    onValueChange={(value) => handleInputChange('permit_status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Estado del permiso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="En trámite">En trámite</SelectItem>
                      <SelectItem value="Aprobado">Aprobado</SelectItem>
                      <SelectItem value="Rechazado">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Fechas y documentación */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Fechas y Documentación</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Fecha de Inicio</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">Fecha Estimada de Finalización</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="dgro_file_number">N° Expediente DGROC</Label>
                  <Input
                    id="dgro_file_number"
                    value={formData.dgro_file_number}
                    onChange={(e) => handleInputChange('dgro_file_number', e.target.value)}
                    placeholder="Ej: EX-2024-12345678-GCABA-DGROC"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="notes">Notas y Observaciones</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Información adicional sobre el proyecto..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting || uploadingImage}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || uploadingImage}
                className="min-w-[140px]"
              >
                {uploadingImage ? 'Subiendo imagen...' : isSubmitting ? 'Creando...' : 'Crear Proyecto'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 