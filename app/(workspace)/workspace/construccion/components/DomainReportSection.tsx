'use client'

import { useState, useRef, useEffect } from 'react'
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
import { useDirectFileUpload } from '@/lib/hooks/useDirectFileUpload'
import { useWorkspace } from '@/components/workspace-context'
import { sanitizeFileName, generateUniqueFilePath } from '@/lib/utils/file-utils'
import { toast } from 'sonner'

interface DomainReportSectionProps {
  project: Project
  onProjectUpdate?: (updatedProject: Project) => void
}

export default function DomainReportSection({ project, onProjectUpdate }: DomainReportSectionProps) {
  const [uploading, setUploading] = useState(false)

  // Hook para obtener el workspace actual
  const { companyId } = useWorkspace()

  // Hook para manejar subidas de archivos con Supabase Storage
  const { uploadFile, progress: hookUploadProgress, isUploading: hookIsUploading } = useDirectFileUpload()

  const handleUploadSuccess = async (fileUrl: string, fileName: string) => {
      try {
        // Si ya existe un informe, guardarlo en historial antes de reemplazar
        if (project.domain_report_file_url) {
          try {
            await fetch('/api/workspace/construction/documents', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectId: project.id,
                sectionName: 'Informe de Dominio',
                fileUrl: project.domain_report_file_url,
                fileName: 'informe-dominio-anterior.pdf',
                description: `Informe anterior - Fecha: ${project.domain_report_upload_date ? new Date(project.domain_report_upload_date).toLocaleDateString('es-AR') : 'No disponible'}`,
                fileSize: 0,
                mimeType: 'application/pdf'
              })
            })
          } catch (err) {
            console.error('Error archiving previous domain report:', err)
            // No bloquear el upload por error en historial
          }
        }

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

        // Refrescar historial
        try {
          const response2 = await fetch(`/api/workspace/construction/documents?projectId=${project.id}`)
          if (response2.ok) {
            const documents = await response2.json()
            const domainReports = documents
              .filter((doc: any) => doc.section_name === 'Informe de Dominio')
              .map((doc: any) => ({
                id: doc.id,
                file_url: doc.file_url,
                original_filename: doc.original_filename || doc.filename,
                upload_date: doc.upload_date || doc.created_at,
                description: doc.description
              }))
            setPreviousReports(domainReports)
          }
        } catch (err) {
          console.error('Error refreshing domain report history:', err)
        }

        // Calcular fecha de vencimiento para mostrar en el mensaje
        const selectedDate = new Date(documentDate)
        const expiryDate = new Date(selectedDate.getTime() + (90 * 24 * 60 * 60 * 1000))

        toast.success(`Informe de dominio subido exitosamente. Fecha del documento: ${selectedDate.toLocaleDateString('es-AR')}. Válido hasta: ${expiryDate.toLocaleDateString('es-AR')}. El informe tiene una validez de 90 días desde la fecha del documento.`)
      } catch (error) {
        console.error('Error updating project with domain report:', error)
        toast.error('Error al actualizar el proyecto con el informe. Por favor, inténtalo de nuevo.')
      }
  }

  const handleUploadError = (error: string) => {
      toast.error(`Error al subir el informe de dominio: ${error}`)
    }

  // Sincronizar estado del hook con estado local
  useEffect(() => {
    setUploading(hookIsUploading)
  }, [hookIsUploading])

  // Cargar historial de informes anteriores
  useEffect(() => {
    const fetchHistory = async () => {
      if (!project.id) return
      setLoadingHistory(true)
      try {
        const response = await fetch(`/api/workspace/construction/documents?projectId=${project.id}`)
        if (response.ok) {
          const documents = await response.json()
          // Filtrar solo informes de dominio del historial
          const domainReports = documents
            .filter((doc: any) => doc.section_name === 'Informe de Dominio')
            .map((doc: any) => ({
              id: doc.id,
              file_url: doc.file_url,
              original_filename: doc.original_filename || doc.filename,
              upload_date: doc.upload_date || doc.created_at,
              description: doc.description
            }))
          setPreviousReports(domainReports)
        }
      } catch (error) {
        console.error('Error loading domain report history:', error)
      } finally {
        setLoadingHistory(false)
      }
    }
    fetchHistory()
  }, [project.id])

  const [notes, setNotes] = useState(project.domain_report_notes || '')
  const [showUploadForm, setShowUploadForm] = useState(!project.domain_report_file_url)
  const [documentDate, setDocumentDate] = useState(
    project.domain_report_upload_date
      ? new Date(project.domain_report_upload_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  )
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previousReports, setPreviousReports] = useState<Array<{
    id: string
    file_url: string
    original_filename: string
    upload_date: string
    description?: string
  }>>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Calcular estado del informe
  const reportStatus = formatDomainReportStatus(project.domain_report_upload_date || null)

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validar que la fecha no sea futura
    const selectedDate = new Date(documentDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to compare only dates

    if (selectedDate > today) {
      toast.error('La fecha del documento no puede ser futura. Ingresa la fecha que aparece en el informe.')
      return
    }

    // Validar que la fecha no sea muy antigua (más de 2 años)
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    if (selectedDate < twoYearsAgo) {
      const confirm = window.confirm('La fecha del documento es de hace más de 2 años. ¿Estás seguro que es correcta?')
      if (!confirm) {
        return
      }
    }

    try {
      // Validar que companyId esté disponible
      if (!companyId) {
        throw new Error('Faltan datos requeridos para Supabase Storage: companyId no disponible')
      }

      // Generar ruta única para el archivo usando la función estándar
      const path = generateUniqueFilePath({
        companyId: companyId,
        projectId: project.id,
        section: 'domain-reports',
        fileName: file.name
      })

      // Subir archivo usando el nuevo sistema de upload directo a Supabase Storage
      const result = await uploadFile({
        bucket: 'construction-documents',
        path,
        file
      })

      // Manejar éxito de la subida
      if (result.success && result.publicUrl) {
        await handleUploadSuccess(result.publicUrl, file.name)
      } else {
        throw new Error(result.error || 'Error al subir el archivo')
      }
    } catch (error) {
      console.error('Error uploading domain report:', error)
      handleUploadError(error instanceof Error ? error.message : 'Error desconocido')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar que se haya ingresado la fecha del documento
    if (!documentDate || documentDate.trim() === '') {
      toast.error('Debes ingresar la fecha del documento antes de seleccionar el archivo.')
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
      '¿Estás seguro que quieres eliminar el informe de dominio?\n\n' +
      'Se eliminará el archivo y toda la información relacionada.\n' +
      'Esta acción no se puede deshacer.'
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

      toast.success('Informe de dominio eliminado exitosamente')

    } catch (error) {
      console.error('Error deleting domain report:', error)
      toast.error(`Error al eliminar el informe de dominio: ${error instanceof Error ? error.message : 'Error desconocido'}`)
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
        return <FileText className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusColor = () => {
    switch (reportStatus.status) {
      case 'valid':
        return 'bg-emerald-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
      case 'expiring':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
      case 'expired':
        return 'bg-destructive/10 text-destructive border-destructive/30'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <div className="space-y-6">
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
                  Fecha de emisión del informe
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
                  90 días desde la emisión
                </p>
              </div>
            </div>

            {/* Días restantes */}
            {reportStatus.daysRemaining !== undefined && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
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
                  <div className="w-full bg-muted rounded-full h-2">
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
                <p className="text-sm p-3 bg-muted/50 rounded-lg">
                  {project.domain_report_notes}
                </p>
              </div>
            )}

            {/* Acciones */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Descargar Informe
              </Button>

              <Button onClick={handleNewUpload} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Subir Nuevo Informe
              </Button>

              <Button
                onClick={handleDeleteReport}
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
                disabled={uploading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {uploading ? 'Eliminando...' : 'Eliminar Informe'}
              </Button>
            </div>

            {/* Alertas importantes */}
            {reportStatus.status === 'expiring' && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-700 dark:text-yellow-400">Informe próximo a vencer</h4>
                    <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
                      El informe vence en {reportStatus.daysRemaining} días. Te recomendamos renovarlo pronto para evitar retrasos en los trámites.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {reportStatus.status === 'expired' && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-medium text-destructive">Informe vencido</h4>
                    <p className="text-sm text-destructive/80 mt-1">
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
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <h4 className="font-medium text-primary mb-3 flex items-center gap-2">
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
                <p className="text-xs text-primary/80">
                  Esta fecha determina cuando vence el informe (90 días desde la emisión)
                </p>
              </div>
            </div>

            {/* PASO 2: Seleccionar Archivo PDF */}
            <div className={`${!documentDate ? 'opacity-50 pointer-events-none' : ''}`}>
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                PASO 2: Seleccionar Archivo PDF
                {!documentDate && <span className="text-destructive text-sm">(Primero ingresa la fecha)</span>}
              </h4>

              {!selectedFile ? (
                // Mostrar drag & drop area cuando no hay archivo seleccionado
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    documentDate
                      ? 'border-border hover:border-primary'
                      : 'border-border bg-muted/50'
                  }`}
                  onClick={() => documentDate && fileInputRef.current?.click()}
                >
                  <div className="space-y-4">
                    <div className={`mx-auto w-12 h-12 rounded-lg flex items-center justify-center ${
                      documentDate ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Upload className={`h-6 w-6 ${documentDate ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>

                    <div>
                      <p className={`text-lg font-medium ${documentDate ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {documentDate ? 'Seleccionar archivo PDF' : 'Primero ingresa la fecha del documento'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {documentDate
                          ? 'Haz clic aquí o arrastra el archivo del informe de dominio'
                          : 'La fecha del documento es obligatoria antes de subir el archivo'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Máximo 50MB - Solo archivos PDF
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Mostrar preview del archivo seleccionado
                <div className="border-2 border-green-300 dark:border-green-700 bg-emerald-500/10 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-400">{selectedFile.name}</p>
                        <p className="text-sm text-green-600 dark:text-green-500">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>

                  <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-400 mb-4">
                      Archivo seleccionado correctamente. Revisa los datos antes de subir.
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={handleConfirmUpload}
                        disabled={uploading}
                        size="sm"
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
                        size="sm"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10"
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
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <h4 className="font-medium text-primary mb-2">Sobre el Informe de Dominio</h4>
              <ul className="text-sm text-primary/80 space-y-1">
                <li>- <strong>Fecha importante:</strong> Ingresar la fecha que aparece EN el documento</li>
                <li>- <strong>Vigencia:</strong> 90 días desde la fecha de emisión del informe</li>
                <li>- <strong>Reutilización:</strong> Puede servir para múltiples trámites del mismo proyecto</li>
                <li>- <strong>Renovación:</strong> Se puede reemplazar cuando esté próximo a vencer</li>
                <li>- <strong>Uso:</strong> Requerido antes del Registro de Etapa de Proyecto</li>
              </ul>
            </div>

            {/* Estado del formulario */}
            <div className="p-4 bg-muted/50 border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {documentDate ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        Fecha configurada: {new Date(documentDate).toLocaleDateString('es-AR')}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
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
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    El informe vencerá el: <strong>{new Date(new Date(documentDate).getTime() + (90 * 24 * 60 * 60 * 1000)).toLocaleDateString('es-AR')}</strong> (90 días desde la emisión)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de Informes Anteriores */}
      {previousReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Historial de Informes ({previousReports.length} anterior{previousReports.length !== 1 ? 'es' : ''})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {previousReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {report.original_filename || 'Informe de Dominio'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {report.upload_date
                            ? new Date(report.upload_date).toLocaleDateString('es-AR')
                            : 'Fecha no disponible'
                          }
                        </span>
                        <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30">
                          Vencido
                        </Badge>
                      </div>
                      {report.description && (
                        <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(report.file_url, '_blank')}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = report.file_url
                        link.download = report.original_filename || 'informe-dominio.pdf'
                        link.click()
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Descargar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
