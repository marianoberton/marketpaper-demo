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
import { Project, formatInhibitionReportStatus, calculateInhibitionReportDaysRemaining } from '@/lib/construction'
import { useDirectFileUpload } from '@/lib/hooks/useDirectFileUpload'
import { useWorkspace } from '@/components/workspace-context'
import { sanitizeFileName, generateUniqueFilePath } from '@/lib/utils/file-utils'

interface InhibitionReportSectionProps {
  project: Project
  onProjectUpdate?: (updatedProject: Project) => void
}

export default function InhibitionReportSection({ project, onProjectUpdate }: InhibitionReportSectionProps) {
  const [uploading, setUploading] = useState(false)
  
  // Hook para obtener el workspace actual
  const { companyId } = useWorkspace()
  
  // Hook para manejar subidas de archivos con Supabase Storage
  const { uploadFile, progress: hookUploadProgress, isUploading: hookIsUploading } = useDirectFileUpload()
  
  const handleUploadSuccess = async (fileUrl: string, fileName: string) => {
      try {
        // Usar la fecha del documento ingresada por el usuario (no la fecha actual)
        const documentDateTime = new Date(documentDate + 'T12:00:00').toISOString() // Agregar hora del mediodía para evitar problemas de zona horaria

        // 1. Actualizar proyecto con nuevo informe
        const response = await fetch('/api/workspace/construction/projects', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: project.id,
            inhibition_report_file_url: fileUrl,
            inhibition_report_upload_date: documentDateTime, // Esta es la fecha del documento
            inhibition_report_notes: notes.trim() || null
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('API Response error:', errorText)
          
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: errorText }
          }
          
          throw new Error(errorData.error || `Error ${response.status}: ${errorText}`)
        }

        const data = await response.json()
        
        // 2. Guardar el documento en la tabla project_documents para que aparezca en la biblioteca
        const documentResponse = await fetch('/api/workspace/construction/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileUrl: fileUrl,
            fileName: fileName,
            originalFileName: selectedFile?.name || fileName,
            projectId: project.id,
            sectionName: 'Informe de Inhibición',
            description: notes.trim() || 'Documento que certifica la ausencia de inhibiciones legales sobre el inmueble o las personas involucradas en el proyecto.',
            fileSize: selectedFile?.size || 0,
            mimeType: selectedFile?.type || 'application/pdf'
          })
        })

        if (!documentResponse.ok) {
          const errorData = await documentResponse.json().catch(() => ({ error: 'Error desconocido' }))
          console.warn('Error al guardar en project_documents:', errorData.error)
          // No fallar la operación principal, solo advertir
        }
        
        if (onProjectUpdate) {
          onProjectUpdate(data.project)
        }

        setShowUploadForm(false)
        setSelectedFile(null) // Limpiar archivo seleccionado
        
        const selectedDate = new Date(documentDate)
        const expiryDate = new Date(selectedDate.getTime() + (90 * 24 * 60 * 60 * 1000))
        
        alert(`✅ Informe de inhibición subido exitosamente\n\n📅 Fecha del documento: ${selectedDate.toLocaleDateString('es-AR')}\n⏰ Válido hasta: ${expiryDate.toLocaleDateString('es-AR')}\n\n💡 El informe tiene una validez de 90 días desde la fecha del documento.`)
      } catch (error: any) {
        console.error('Error updating project with inhibition report:', error)
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          projectId: project.id,
          fileUrl,
          fileName,
          documentDate,
          notes: notes.trim()
        })
        alert(`❌ Error al actualizar el proyecto con el informe\n\nDetalles: ${error.message}\n\n💡 Por favor, inténtalo de nuevo o contacta al soporte si el problema persiste.`)
      }
  }
  
  const handleUploadError = (error: string) => {
      alert(`❌ Error al subir el informe de inhibición\n\nDetalles: ${error}\n\n💡 Verifica:\n• Que el archivo sea un PDF válido\n• Que tengas conexión a internet\n• Que la fecha del documento sea correcta`)
    }
  
  // Sincronizar estado del hook con estado local
  useEffect(() => {
    setUploading(hookIsUploading)
  }, [hookIsUploading])
  
  const [notes, setNotes] = useState(project.inhibition_report_notes || '')
  const [showUploadForm, setShowUploadForm] = useState(!project.inhibition_report_file_url)
  const [documentDate, setDocumentDate] = useState(
    project.inhibition_report_upload_date 
      ? new Date(project.inhibition_report_upload_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  )
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Calcular estado del informe (se actualiza automáticamente cuando cambia project.inhibition_report_upload_date)
  const reportStatus = formatInhibitionReportStatus(project.inhibition_report_upload_date || null)

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validar fecha del documento
    const selectedDate = new Date(documentDate)
    const today = new Date()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(today.getFullYear() - 1)

    // Validar que la fecha no sea futura
    if (selectedDate > today) {
      alert('❌ La fecha del documento no puede ser futura')
      return
    }

    // Validar que la fecha no sea muy antigua (más de 1 año)
    if (selectedDate < oneYearAgo) {
      alert('❌ La fecha del documento no puede ser anterior a un año')
      return
    }

    try {
      setUploading(true)
      
      // Validar que sea un PDF
      if (file.type !== 'application/pdf') {
        alert('❌ Solo se permiten archivos PDF')
        return
      }

      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('❌ El archivo es demasiado grande. Máximo 10MB.')
        return
      }

      // Generar nombre único para el archivo
      const uniqueFilePath = generateUniqueFilePath({
        companyId: companyId || '',
        projectId: project.id,
        section: 'inhibition-reports',
        fileName: file.name
      })

      // Subir archivo usando el hook
      const result = await uploadFile({
        bucket: 'construction-documents',
        path: uniqueFilePath,
        file
      })
      
      if (result.success && result.publicUrl) {
        await handleUploadSuccess(result.publicUrl, file.name)
      } else {
        throw new Error(result.error || 'Error al subir archivo')
      }
    } catch (error) {
      console.error('Error uploading inhibition report:', error)
      handleUploadError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleConfirmUpload = () => {
    if (selectedFile) {
      handleFileUpload(selectedFile)
    }
  }

  const handleCancelFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDownload = () => {
    if (project.inhibition_report_file_url) {
      const link = document.createElement('a')
      link.href = project.inhibition_report_file_url
      link.download = `informe-inhibicion-${project.name}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleNewUpload = () => {
    setShowUploadForm(true)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeleteReport = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este informe de inhibición?')) {
      return
    }

    try {
      const response = await fetch('/api/workspace/construction/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: project.id,
          inhibition_report_file_url: null,
          inhibition_report_upload_date: null,
          inhibition_report_notes: null
        }),
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el informe')
      }

      const data = await response.json()
      
      if (onProjectUpdate) {
        onProjectUpdate(data.project)
      }

      setShowUploadForm(true)
      setNotes('')
      alert('✅ Informe de inhibición eliminado exitosamente')
    } catch (error) {
      console.error('Error deleting inhibition report:', error)
      alert('❌ Error al eliminar el informe. Por favor, inténtalo de nuevo.')
    }
  }

  // Funciones para obtener el ícono y color del estado
  const getStatusIcon = () => {
    if (!project.inhibition_report_file_url) return AlertTriangle
    
    const daysRemaining = calculateInhibitionReportDaysRemaining(project.inhibition_report_upload_date || null)
    
    if (daysRemaining === null || daysRemaining < 0) return AlertTriangle
    if (daysRemaining <= 15) return Clock
    return CheckCircle
  }

  const getStatusColor = () => {
    if (!project.inhibition_report_file_url) return 'text-yellow-600'
    
    const daysRemaining = calculateInhibitionReportDaysRemaining(project.inhibition_report_upload_date || null)
    
    if (daysRemaining === null || daysRemaining < 0) return 'text-red-600'
    if (daysRemaining <= 15) return 'text-yellow-600'
    return 'text-green-600'
  }

  const handleUpdateNotes = async () => {
    try {
      const response = await fetch('/api/workspace/construction/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: project.id,
          inhibition_report_notes: notes.trim() || null
        }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar las notas')
      }

      const data = await response.json()
      
      if (onProjectUpdate) {
        onProjectUpdate(data.project)
      }

      alert('✅ Notas actualizadas exitosamente')
    } catch (error) {
      console.error('Error updating inhibition report notes:', error)
      alert('❌ Error al actualizar las notas. Por favor, inténtalo de nuevo.')
    }
  }

  const openFile = () => {
    if (project.inhibition_report_file_url) {
      window.open(project.inhibition_report_file_url, '_blank')
    }
  }

  const downloadFile = () => {
    if (project.inhibition_report_file_url) {
      const link = document.createElement('a')
      link.href = project.inhibition_report_file_url
      link.download = `informe-inhibicion-${project.name || project.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const StatusIcon = getStatusIcon()

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-blue-50 ${getStatusColor()}`}>
            <StatusIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Informe de Inhibición
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Certificación de ausencia de inhibiciones legales
            </p>
          </div>
          <Badge variant={
            !project.inhibition_report_file_url ? 'secondary' :
            calculateInhibitionReportDaysRemaining(project.inhibition_report_upload_date || null) === null || 
            calculateInhibitionReportDaysRemaining(project.inhibition_report_upload_date || null)! < 0 ? 'destructive' :
            calculateInhibitionReportDaysRemaining(project.inhibition_report_upload_date || null)! <= 15 ? 'secondary' : 'default'
          }>
            {reportStatus.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Estado actual del informe */}
        {project.inhibition_report_file_url ? (
          <div className="space-y-4">
            {/* Información del archivo actual */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900">Informe actual</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {reportStatus.message}
                    </p>
                    {project.inhibition_report_upload_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        Fecha de carga: {new Date(project.inhibition_report_upload_date).toLocaleDateString('es-AR')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-start">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openFile}
                    className="text-blue-600 hover:text-blue-700 text-xs px-2 py-1 h-7"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadFile}
                    className="text-green-600 hover:text-green-700 text-xs px-2 py-1 h-7"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Descargar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNewUpload}
                    className="text-orange-600 hover:text-orange-700 text-xs px-2 py-1 h-7"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reemplazar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteReport}
                    className="text-red-600 hover:text-red-700 text-xs px-2 py-1 h-7"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>

            {/* Notas del informe */}
            <div className="space-y-3">
              <Label htmlFor="inhibition-notes" className="text-sm font-medium text-gray-700">
                Notas adicionales
              </Label>
              <Textarea
                id="inhibition-notes"
                placeholder="Agregar notas sobre el informe de inhibición..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <Button
                onClick={handleUpdateNotes}
                variant="outline"
                size="sm"
                className="w-fit"
              >
                Actualizar notas
              </Button>
            </div>
          </div>
        ) : null}

        {/* Formulario de subida */}
        {showUploadForm && (
          <div className="space-y-4">
            <Separator />
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Pendiente</span>
              </div>
              <p className="text-sm text-yellow-700">
                Se requiere subir el informe de inhibición para continuar con el proyecto.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="document-date" className="text-sm font-medium text-gray-700">
                  Fecha del documento *
                </Label>
                <Input
                  id="document-date"
                  type="date"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                  className="mt-1"
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ingresa la fecha que aparece en el documento, no la fecha de hoy
                </p>
              </div>

              <div>
                <Label htmlFor="file-upload" className="text-sm font-medium text-gray-700">
                  Archivo PDF *
                </Label>
                <div className="mt-1">
                  {!selectedFile ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        ref={fileInputRef}
                        id="file-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="mx-auto"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Seleccionar archivo
                      </Button>
                      <p className="text-sm text-gray-500 mt-2">
                        Sin archivos seleccionados
                      </p>
                    </div>
                  ) : (
                    <div className="border border-gray-300 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelFile}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                  Notas adicionales
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Agregar notas sobre el informe de inhibición..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 min-h-[80px] resize-none"
                />
              </div>

              <Button
                onClick={handleConfirmUpload}
                disabled={!selectedFile || uploading}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo informe...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir informe
                  </>
                )}
              </Button>

              {/* Progreso de subida */}
              {uploading && hookUploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progreso de subida</span>
                    <span>{Math.round(hookUploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${hookUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}