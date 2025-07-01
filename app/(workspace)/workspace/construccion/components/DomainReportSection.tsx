'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  Upload, 
  Download, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  RefreshCw,
  Trash2
} from 'lucide-react'
import { Project, formatDomainReportStatus, calculateDomainReportDaysRemaining } from '@/lib/construction'

interface DomainReportSectionProps {
  project: Project
  onProjectUpdate?: (updatedProject: Project) => void
}

export default function DomainReportSection({ project, onProjectUpdate }: DomainReportSectionProps) {
  const [uploading, setUploading] = useState(false)
  const [notes, setNotes] = useState(project.domain_report_notes || '')
  const [showUploadForm, setShowUploadForm] = useState(!project.domain_report_file_url)
  const [documentDate, setDocumentDate] = useState(
    project.domain_report_upload_date 
      ? new Date(project.domain_report_upload_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  )
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Calcular estado del informe
  const reportStatus = formatDomainReportStatus(project.domain_report_upload_date || null)
  
  const handleFileUpload = async (file: File) => {
    if (!file) return

    try {
      setUploading(true)

      // Validar que la fecha no sea futura
      const selectedDate = new Date(documentDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time to compare only dates
      
      if (selectedDate > today) {
        alert('❌ Error: La fecha del documento no puede ser futura.\n\n📅 Ingresa la fecha que aparece en el informe, no la fecha de hoy.')
        return
      }

      // Validar que la fecha no sea muy antigua (más de 2 años)
      const twoYearsAgo = new Date()
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
      
      if (selectedDate < twoYearsAgo) {
        const confirm = window.confirm('⚠️ Advertencia: La fecha del documento es de hace más de 2 años.\n\n¿Estás seguro que es correcta?')
        if (!confirm) {
          return
        }
      }

      // Subir archivo a Supabase Storage
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', project.id)
      formData.append('sectionName', 'Informe de Dominio')
      formData.append('description', `Informe de dominio - Fecha: ${documentDate}`)

      const uploadResponse = await fetch('/api/workspace/construction/documents', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Error al subir el archivo')
      }

      const uploadResult = await uploadResponse.json()
      const fileUrl = uploadResult.file_url
      
      // Usar la fecha del documento ingresada por el usuario (no la fecha actual)
      const documentDateTime = new Date(documentDate + 'T12:00:00').toISOString() // Agregar hora del mediodía para evitar problemas de zona horaria

      // Actualizar proyecto con nuevo informe
      const response = await fetch('/api/workspace/construction/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: project.id,
          domain_report_file_url: fileUrl,
          domain_report_upload_date: documentDateTime, // Esta es la fecha del documento
          domain_report_notes: notes.trim() || null
        }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el proyecto')
      }

      const data = await response.json()
      
      if (onProjectUpdate) {
        onProjectUpdate(data.project)
      }

      setShowUploadForm(false)
      setSelectedFile(null) // Limpiar archivo seleccionado
      
      // Calcular fecha de vencimiento para mostrar en el mensaje
      const expiryDate = new Date(selectedDate.getTime() + (90 * 24 * 60 * 60 * 1000))
      
      alert(`✅ ¡Informe de dominio subido exitosamente!\n\n📅 Fecha del documento: ${selectedDate.toLocaleDateString('es-AR')}\n⏰ Vence el: ${expiryDate.toLocaleDateString('es-AR')}\n🗓️ Días restantes: ${Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}`)
      
    } catch (error) {
      console.error('Error uploading domain report:', error)
      alert(`❌ Error al subir el informe de dominio\n\nDetalles: ${error instanceof Error ? error.message : 'Error desconocido'}\n\n💡 Verifica:\n• Que el archivo sea un PDF válido\n• Que tengas conexión a internet\n• Que la fecha del documento sea correcta`)
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar que sea PDF
    if (file.type !== 'application/pdf') {
      alert('❌ Error: El archivo debe ser un PDF\n\n💡 Verifica que el archivo tenga extensión .pdf')
      return
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('❌ Error: El archivo no debe superar los 10MB\n\n💡 Intenta comprimir el PDF o usar una versión más pequeña')
      return
    }

    // Validar que se haya ingresado la fecha del documento
    if (!documentDate || documentDate.trim() === '') {
      alert('❌ Error: Debes ingresar la fecha del documento antes de seleccionar el archivo.\n\n📅 Revisa la fecha que aparece impresa en el informe de dominio.')
      return
    }

    // Solo guardar el archivo seleccionado, no subir todavía
    setSelectedFile(file)
  }

  const handleConfirmUpload = async () => {
    if (!selectedFile) return
    await handleFileUpload(selectedFile)
  }

  const handleCancelFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDownload = () => {
    if (project.domain_report_file_url) {
      window.open(project.domain_report_file_url, '_blank')
    }
  }

  const handleNewUpload = () => {
    setShowUploadForm(true)
    setSelectedFile(null) // Limpiar archivo seleccionado
    setNotes(project.domain_report_notes || '')
    // Al subir un nuevo informe, mantener la fecha actual del documento o fecha de hoy
    setDocumentDate(
      project.domain_report_upload_date 
        ? new Date(project.domain_report_upload_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
    )
  }

  const handleDeleteReport = async () => {
    const confirmDelete = window.confirm(
      '⚠️ ¿Estás seguro que quieres eliminar el informe de dominio?\n\n' +
      '• Se eliminará el archivo y toda la información relacionada\n' +
      '• Esta acción no se puede deshacer\n' +
      '• Tendrás que volver a subir un informe si lo necesitas\n\n' +
      '¿Proceder con la eliminación?'
    )

    if (!confirmDelete) return

    try {
      setUploading(true)

      // Eliminar informe del proyecto
      const response = await fetch('/api/workspace/construction/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: project.id,
          domain_report_file_url: null,
          domain_report_upload_date: null,
          domain_report_notes: null
        }),
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el informe')
      }

      const data = await response.json()
      
      if (onProjectUpdate) {
        onProjectUpdate(data.project)
      }

      alert('✅ Informe de dominio eliminado exitosamente')
      
    } catch (error) {
      console.error('Error deleting domain report:', error)
      alert(`❌ Error al eliminar el informe de dominio\n\nDetalles: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setUploading(false)
    }
  }

  const getStatusIcon = () => {
    switch (reportStatus.status) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'expiring':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'expired':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (reportStatus.status) {
      case 'valid':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'expiring':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Informe de Dominio</h2>
            <p className="text-sm text-muted-foreground">
              Documento requerido para el Registro de Etapa de Proyecto (vigencia 90 días)
            </p>
          </div>
        </div>
      </div>

      {/* Estado actual del informe */}
      {project.domain_report_file_url && !showUploadForm ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span>Estado del Informe</span>
              </div>
              <Badge className={getStatusColor()}>
                {reportStatus.message}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Información del archivo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Fecha del Documento
                </Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {project.domain_report_upload_date 
                      ? new Date(project.domain_report_upload_date).toLocaleDateString('es-AR')
                      : 'No disponible'
                    }
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  📄 Fecha de emisión del informe
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Fecha de Vencimiento
                </Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {project.domain_report_upload_date 
                      ? new Date(new Date(project.domain_report_upload_date).getTime() + (90 * 24 * 60 * 60 * 1000)).toLocaleDateString('es-AR')
                      : 'No disponible'
                    }
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ⏰ 90 días desde la emisión
                </p>
              </div>
            </div>

            {/* Días restantes */}
            {reportStatus.daysRemaining !== undefined && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <span className="font-medium">Días restantes:</span>
                  </div>
                  <span className={`text-lg font-bold ${
                    reportStatus.daysRemaining > 10 ? 'text-green-600' :
                    reportStatus.daysRemaining > 0 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {reportStatus.daysRemaining} días
                  </span>
                </div>
                
                {/* Barra de progreso visual */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        reportStatus.daysRemaining > 10 ? 'bg-green-500' :
                        reportStatus.daysRemaining > 0 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, (reportStatus.daysRemaining / 90) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notas */}
            {project.domain_report_notes && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Notas
                </Label>
                <p className="text-sm p-3 bg-gray-50 rounded-lg">
                  {project.domain_report_notes}
                </p>
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-3">
              <Button onClick={handleDownload} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Descargar Informe
              </Button>
              
              <Button onClick={handleNewUpload} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Subir Nuevo Informe
              </Button>

              <Button 
                onClick={handleDeleteReport} 
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                disabled={uploading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {uploading ? 'Eliminando...' : 'Eliminar Informe'}
              </Button>
            </div>

            {/* Alertas importantes */}
            {reportStatus.status === 'expiring' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Informe próximo a vencer</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      El informe vence en {reportStatus.daysRemaining} días. Te recomendamos renovarlo pronto para evitar retrasos en los trámites.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {reportStatus.status === 'expired' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800">Informe vencido</h4>
                    <p className="text-sm text-red-700 mt-1">
                      El informe de dominio ha vencido. Es necesario subir uno nuevo para continuar con los trámites.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Formulario de subida */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {project.domain_report_file_url ? 'Subir Nuevo Informe' : 'Subir Informe de Dominio'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* PASO 1: Fecha del documento (OBLIGATORIO) */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                PASO 1: Fecha del Documento (Obligatorio)
              </h4>
              <div className="space-y-2">
                <Label htmlFor="document_date" className="text-sm font-medium">
                  ¿Qué fecha aparece en el informe de dominio? *
                </Label>
                <Input
                  id="document_date"
                  type="date"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]} // No permite fechas futuras
                  required
                  className="font-medium"
                />
                <p className="text-xs text-blue-700">
                  📄 Esta fecha determina cuando vence el informe (90 días desde la emisión)
                </p>
              </div>
            </div>

            {/* PASO 2: Seleccionar Archivo PDF */}
            <div className={`${!documentDate ? 'opacity-50 pointer-events-none' : ''}`}>
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                PASO 2: Seleccionar Archivo PDF
                {!documentDate && <span className="text-red-500 text-sm">(Primero ingresa la fecha)</span>}
              </h4>
              
              {!selectedFile ? (
                // Mostrar drag & drop area cuando no hay archivo seleccionado
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    documentDate 
                      ? 'border-gray-300 hover:border-blue-400' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                  onClick={() => documentDate && fileInputRef.current?.click()}
                >
                  <div className="space-y-4">
                    <div className={`mx-auto w-12 h-12 rounded-lg flex items-center justify-center ${
                      documentDate ? 'bg-blue-100' : 'bg-gray-200'
                    }`}>
                      <Upload className={`h-6 w-6 ${documentDate ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    
                    <div>
                      <p className={`text-lg font-medium ${documentDate ? 'text-gray-900' : 'text-gray-500'}`}>
                        {documentDate ? 'Seleccionar archivo PDF' : 'Primero ingresa la fecha del documento'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {documentDate 
                          ? 'Haz clic aquí o arrastra el archivo del informe de dominio'
                          : 'La fecha del documento es obligatoria antes de subir el archivo'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Máximo 10MB • Solo archivos PDF
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Mostrar preview del archivo seleccionado
                <div className="border-2 border-green-300 bg-green-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-800">{selectedFile.name}</p>
                        <p className="text-sm text-green-600">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-sm text-green-700 mb-4">
                      ✅ Archivo seleccionado correctamente. Revisa los datos antes de subir.
                    </p>
                    
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleConfirmUpload}
                        disabled={uploading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {uploading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Confirmar y Subir
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={handleCancelFile}
                        disabled={uploading}
                        className="border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Cambiar Archivo
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Input oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading || !documentDate}
              />
            </div>

            {/* PASO 3: Notas opcionales */}
            <div className="space-y-2">
              <Label htmlFor="domain_notes" className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                PASO 3: Notas (Opcional)
              </Label>
              <Textarea
                id="domain_notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Informe de dominio actualizado para múltiples trámites..."
                rows={3}
              />
            </div>

            {/* Información adicional */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">📋 Sobre el Informe de Dominio</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Fecha importante:</strong> Ingresar la fecha que aparece EN el documento</li>
                <li>• <strong>Vigencia:</strong> 90 días desde la fecha de emisión del informe</li>
                <li>• <strong>Reutilización:</strong> Puede servir para múltiples trámites del mismo proyecto</li>
                <li>• <strong>Renovación:</strong> Se puede reemplazar cuando esté próximo a vencer</li>
                <li>• <strong>Uso:</strong> Requerido antes del Registro de Etapa de Proyecto</li>
              </ul>
            </div>

            {/* Estado del formulario */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {documentDate ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        Fecha configurada: {new Date(documentDate).toLocaleDateString('es-AR')}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium text-orange-700">
                        Fecha del documento requerida
                      </span>
                    </>
                  )}
                </div>
                
                {project.domain_report_file_url && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowUploadForm(false)
                      setSelectedFile(null)
                      // Restaurar la fecha original del documento al cancelar
                      setDocumentDate(
                        project.domain_report_upload_date 
                          ? new Date(project.domain_report_upload_date).toISOString().split('T')[0]
                          : new Date().toISOString().split('T')[0]
                      )
                    }}
                    disabled={uploading}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
              
              {documentDate && (
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <p className="text-xs text-gray-600">
                    ✅ El informe vencerá el: <strong>{new Date(new Date(documentDate).getTime() + (90 * 24 * 60 * 60 * 1000)).toLocaleDateString('es-AR')}</strong> (90 días desde la emisión)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips adicionales */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <h4 className="font-medium text-green-800 mb-2">💡 Consejos útiles</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• <strong>Fecha del documento:</strong> Revisar la fecha que aparece impresa en el informe</li>
            <li>• <strong>Vigencia:</strong> 90 días se cuentan desde la fecha de emisión, no de subida</li>
            <li>• <strong>Reutilización:</strong> El mismo informe puede usarse para varios trámites del proyecto</li>
            <li>• <strong>Alertas automáticas:</strong> Te avisaremos cuando falten 10 días para el vencimiento</li>
            <li>• <strong>Renovación:</strong> Puedes subir un informe nuevo antes del vencimiento</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
} 