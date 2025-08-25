'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { X, Building, MapPin, User, Calendar, DollarSign, FileText, Settings, Upload, Image as ImageIcon, Calculator, CheckCircle, Info, Plus } from 'lucide-react'
import { Client, ProjectStage, CreateProjectData } from '@/lib/construction'
import { uploadProjectImage } from '@/lib/storage'
import Image from 'next/image'
import { ProjectProfessional } from '@/lib/construction'
import ExpedientesManager from '@/components/ExpedientesManager'
import { ProjectExpediente } from '@/lib/construction'
import { useDirectFileUpload } from '@/lib/hooks/useDirectFileUpload'
import { useWorkspace } from '@/components/workspace-context'
import { sanitizeFileName } from '@/lib/utils/file-utils'

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
    barrio: '',
    ciudad: '',
    surface: undefined,
    director_obra: '',
    builder: '',
    client_id: '',
    start_date: '',
    end_date: '',
    budget: undefined,
    current_stage: 'Prefactibilidad del proyecto',
    profesionales: [],
    notes: '',
    project_type: '',
    project_usage: '',
    cover_image_url: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [enableTaxManagement, setEnableTaxManagement] = useState(false)
  const [expedientes, setExpedientes] = useState<ProjectExpediente[]>([])
  
  // Hook para obtener el workspace actual
  const { companyId } = useWorkspace()
  
  // Hook para manejar subidas directas de imágenes con URLs firmadas
  const { uploadFile, isUploading: hookIsUploading } = useDirectFileUpload()

  // Sincronizar estado del hook con estado local para imágenes
  useEffect(() => {
    setUploadingImage(hookIsUploading)
  }, [hookIsUploading])

  // Función para calcular estimaciones de tasas gubernamentales
  const calculateTaxEstimates = () => {
    const surface = formData.surface || 0
    const budget = formData.budget || 0
    
    if (surface === 0 && budget === 0) {
      return { total: 0, professional_fees: 0, construction_rights: 0, surplus_value: 0, method: 'Ingrese presupuesto o superficie para calcular' }
    }

    let professionalFees = 0
    let constructionRights = 0
    let surplusValue = 0
    let method = ''

    if (budget > 0) {
      // Método basado en presupuesto (más preciso)
      method = 'Basado en presupuesto'
      professionalFees = budget * 0.010 // 1% del presupuesto
      constructionRights = budget * 0.004 // 0.4% del presupuesto
      surplusValue = budget * 0.025 // 2.5% del presupuesto
    } else if (surface > 0) {
      // Método basado en superficie (estimativo)
      method = 'Basado en superficie'
      const updatedParams = {
        cpau_rate: 12000,
        cpic_rate: 8000,
        construction_rate: 7000,
        surplus_rate: 35000
      }
      professionalFees = (updatedParams.cpau_rate + updatedParams.cpic_rate) * surface
      constructionRights = updatedParams.construction_rate * surface
      surplusValue = updatedParams.surplus_rate * surface
    }
    
    return {
      total: professionalFees + constructionRights + surplusValue,
      professional_fees: professionalFees,
      construction_rights: constructionRights,
      surplus_value: surplusValue,
      method
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'El archivo debe ser una imagen' }))
        return
      }
      
      // Validar tamaño (máximo 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'La imagen no debe superar los 50MB' }))
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
      
      // Subir imagen usando subida directa con URL firmada
      try {
        // Generar ruta sanitizada para la imagen
        const timestamp = new Date().toISOString().split('T')[0]
        const sanitizedFileName = sanitizeFileName(file.name)
        const path = `${companyId || 'default'}/projects/covers/${timestamp}/${sanitizedFileName}`
        
        const result = await uploadFile({
          bucket: 'company-logos',
          path,
          file
        })
        
        if (!result.success) {
          throw new Error(result.error || 'Error al subir la imagen')
        }
        
        // La imagen se subió exitosamente - actualizar el estado con la URL
        if (result.publicUrl) {
          setFormData(prev => ({ ...prev, cover_image_url: result.publicUrl }))
        }
      } catch (error) {
        console.error('Error uploading image:', error)
        setErrors(prev => ({ ...prev, image: error instanceof Error ? error.message : 'Error subiendo imagen' }))
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
      const projectWithoutImage = { 
        ...formData,
        expedientes: expedientes
      }
      delete projectWithoutImage.cover_image_url
      
      // Solo incluir enable_tax_management si está activado
      // (para evitar problemas si la migración no se ha ejecutado)
      if (enableTaxManagement) {
        projectWithoutImage.enable_tax_management = true
        
        // También incluir el costo proyectado si se calculó
        const estimates = calculateTaxEstimates()
        if (estimates.total > 0) {
          projectWithoutImage.projected_total_cost = estimates.total
        }
      }
      
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
        current_stage: 'Prefactibilidad del proyecto',
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
      setEnableTaxManagement(false)
      setExpedientes([])
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

  // Funciones para manejar profesionales
  const handleProfesionalChange = (index: number, field: keyof ProjectProfessional, value: string) => {
    setFormData(prev => {
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
    setFormData(prev => ({
      ...prev,
      profesionales: [...(prev.profesionales || []), { name: '', role: 'Estructuralista' as const }]
    }))
  }

  const removeProfesional = (index: number) => {
    setFormData(prev => ({
      ...prev,
      profesionales: (prev.profesionales || []).filter((_, i) => i !== index)
    }))
  }

  const handleExpedientesChange = (newExpedientes: ProjectExpediente[]) => {
    setExpedientes(newExpedientes)
  }

  const handleClose = () => {
    setFormData({
      name: '',
      address: '',
      barrio: '',
      ciudad: '',
      surface: undefined,
      director_obra: '',
      builder: '',
      client_id: '',
      start_date: '',
      end_date: '',
      budget: undefined,
      current_stage: 'Prefactibilidad del proyecto',
      profesionales: [],
      notes: '',
      project_type: '',
      project_usage: '',
      cover_image_url: ''
    })
    setSelectedImage(null)
    setImagePreview('')
    setErrors({})
    setEnableTaxManagement(false)
    setExpedientes([])
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
                    placeholder="Ej: Av. Santa Fe 1234"
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
                </div>

                <div>
                  <Label htmlFor="barrio">Barrio</Label>
                  <Input
                    id="barrio"
                    value={formData.barrio || ''}
                    onChange={(e) => handleInputChange('barrio', e.target.value)}
                    placeholder="Ej: Palermo"
                  />
                </div>

                <div>
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    value={formData.ciudad || ''}
                    onChange={(e) => handleInputChange('ciudad', e.target.value)}
                    placeholder="Ej: CABA"
                  />
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
                        PNG, JPG, GIF hasta 50MB
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
                      <SelectItem value="Microobra">Microobra</SelectItem>
                      <SelectItem value="Obra Menor">Obra Menor</SelectItem>
                      <SelectItem value="Obra Media">Obra Media</SelectItem>
                      <SelectItem value="Obra Mayor">Obra Mayor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="project_usage">Tipo de Uso</Label>
                  <Select 
                    value={formData.project_usage} 
                    onValueChange={(value) => handleInputChange('project_usage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar uso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vivienda">Vivienda</SelectItem>
                      <SelectItem value="Comercial">Comercial</SelectItem>
                      <SelectItem value="Industrial">Industrial</SelectItem>
                      <SelectItem value="Mixto">Mixto</SelectItem>
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
                  <Label htmlFor="director_obra">Director de Obra</Label>
                  <Input
                    id="director_obra"
                    value={formData.director_obra}
                    onChange={(e) => handleInputChange('director_obra', e.target.value)}
                    placeholder="Nombre del director de obra"
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
              </div>

              {/* Otros Profesionales */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-green-600" />
                  <h4 className="text-lg font-semibold">Otros Profesionales</h4>
                </div>

                <div className="space-y-3">
                  {formData.profesionales?.map((profesional, index) => (
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
                      {formData.profesionales && formData.profesionales.length > 0 && (
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
                  <Label>Expedientes</Label>
                  <ExpedientesManager
                    projectId=""
                    expedientes={expedientes}
                    onExpedientesChange={handleExpedientesChange}
                    readOnly={false}
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

            <Separator />

            {/* Gestión de Tasas Gubernamentales */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Gestión de Tasas Gubernamentales</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-1">Gestión Automática de Tasas</h4>
                    <p className="text-sm text-blue-700">
                      Active esta opción para gestionar automáticamente las tasas profesionales (CPAU/CPIC), 
                      derechos de construcción y plusvalía. Se calculará en base al presupuesto o superficie del proyecto.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enable-tax-management"
                    checked={enableTaxManagement}
                    onChange={(e) => setEnableTaxManagement(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <Label htmlFor="enable-tax-management" className="flex items-center gap-2 cursor-pointer">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Activar gestión de tasas gubernamentales
                  </Label>
                </div>

                {enableTaxManagement && (() => {
                  const estimates = calculateTaxEstimates()
                  return (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-900 mb-3">Estimación de Tasas</h4>
                      
                      <div className="text-sm text-green-700 mb-3">
                        <strong>Método de cálculo:</strong> {estimates.method}
                      </div>

                      {estimates.total > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-green-700">Tasas Profesionales:</span>
                              <span className="font-medium text-green-900">{formatCurrency(estimates.professional_fees)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-green-700">Derechos de Construcción:</span>
                              <span className="font-medium text-green-900">{formatCurrency(estimates.construction_rights)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-green-700">Plusvalía:</span>
                              <span className="font-medium text-green-900">{formatCurrency(estimates.surplus_value)}</span>
                            </div>
                          </div>
                          <div className="md:text-right">
                            <div className="p-3 bg-white rounded-lg border border-green-300">
                              <div className="text-sm text-green-700 mb-1">Total Estimado</div>
                              <div className="text-xl font-bold text-green-900">{formatCurrency(estimates.total)}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-green-600 space-y-2">
                          <p><strong>💡 Para obtener estimaciones precisas:</strong></p>
                          <ul className="text-xs space-y-1 ml-4">
                            <li>• <strong>Recomendado:</strong> Ingrese el presupuesto total de la obra</li>
                            <li>• <strong>Alternativo:</strong> Ingrese la superficie en m²</li>
                          </ul>
                          <p className="text-xs text-green-500 mt-2">
                            <em>Las estimaciones se actualizarán automáticamente al completar estos campos</em>
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-600">
                        <strong>Nota:</strong> Esta es una estimación inicial. Los montos exactos se calcularán según los parámetros vigentes al momento del pago.
                      </div>
                    </div>
                  )
                })()}
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