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
  CheckCircle,
  AlertTriangle,
  Eye,
  RefreshCw,
  Trash2
} from 'lucide-react'
import { Project } from '@/lib/construction'
import { useDirectFileUpload } from '@/lib/hooks/useDirectFileUpload'
import { useWorkspace } from '@/components/workspace-context'
import { generateUniqueFilePath } from '@/lib/utils/file-utils'
import { toast } from 'sonner'

interface ContractSectionProps {
  project: Project
  onProjectUpdate?: (updatedProject: Project) => void
}

export default function ContractSection({ project, onProjectUpdate }: ContractSectionProps) {
  const [uploading, setUploading] = useState(false)

  // Hook para obtener el workspace actual
  const { companyId } = useWorkspace()

  // Hook para manejar subidas de archivos con Supabase Storage
  const { uploadFile, progress: hookUploadProgress, isUploading: hookIsUploading } = useDirectFileUpload()

  const handleUploadSuccess = async (fileUrl: string, fileName: string) => {
    try {
      // Usar la fecha del documento ingresada por el usuario
      const documentDateTime = new Date(documentDate + 'T12:00:00').toISOString()

      // 1. Actualizar proyecto con nuevo contrato
      const response = await fetch('/api/workspace/construction/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: project.id,
          construction_contract_file_url: fileUrl,
          construction_contract_upload_date: documentDateTime,
          construction_contract_notes: notes.trim() || null
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
          sectionName: 'Contrato de Obra',
          description: notes.trim() || 'Contrato de obra del proyecto de construcción.',
          fileSize: selectedFile?.size || 0,
          mimeType: selectedFile?.type || 'application/pdf'
        })
      })

      if (!documentResponse.ok) {
        const errorData = await documentResponse.json().catch(() => ({ error: 'Error desconocido' }))
        console.error('Error al guardar en project_documents:', errorData.error)
        // No fallar la operación principal, solo advertir
      }

      if (onProjectUpdate) {
        onProjectUpdate(data.project)
      }

      setShowUploadForm(false)
      setSelectedFile(null)

      const selectedDate = new Date(documentDate)
      toast.success(`Contrato de obra subido exitosamente. Fecha del documento: ${selectedDate.toLocaleDateString('es-AR')}.`)
    } catch (error: any) {
      console.error('Error updating project with construction contract:', error)
      toast.error(`Error al actualizar el proyecto con el contrato: ${error.message}`)
    }
  }

  const handleUploadError = (error: string) => {
    toast.error(`Error al subir el contrato de obra: ${error}`)
  }

  // Sincronizar estado del hook con estado local
  useEffect(() => {
    setUploading(hookIsUploading)
  }, [hookIsUploading])

  const [notes, setNotes] = useState(project.construction_contract_notes || '')
  const [showUploadForm, setShowUploadForm] = useState(!project.construction_contract_file_url)
  const [documentDate, setDocumentDate] = useState(
    project.construction_contract_upload_date
      ? new Date(project.construction_contract_upload_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  )
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const acceptedFileTypes = '.pdf,.doc,.docx'
  const acceptedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validar fecha del documento
    const selectedDate = new Date(documentDate)
    const today = new Date()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(today.getFullYear() - 1)

    // Validar que la fecha no sea futura
    if (selectedDate > today) {
      toast.error('La fecha del documento no puede ser futura')
      return
    }

    // Validar que la fecha no sea muy antigua (más de 1 año)
    if (selectedDate < oneYearAgo) {
      toast.error('La fecha del documento no puede ser anterior a un año')
      return
    }

    try {
      setUploading(true)

      // Validar tipo de archivo (PDF, DOC, DOCX)
      if (!acceptedMimeTypes.includes(file.type)) {
        toast.error('Solo se permiten archivos PDF, DOC o DOCX')
        return
      }

      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. Máximo 10MB.')
        return
      }

      // Generar nombre único para el archivo
      const uniqueFilePath = generateUniqueFilePath({
        companyId: companyId || '',
        projectId: project.id,
        section: 'contracts',
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
      console.error('Error uploading construction contract:', error)
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

  const handleNewUpload = () => {
    setShowUploadForm(true)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeleteContract = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este contrato de obra?')) {
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
          construction_contract_file_url: null,
          construction_contract_upload_date: null,
          construction_contract_notes: null
        }),
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el contrato')
      }

      const data = await response.json()

      if (onProjectUpdate) {
        onProjectUpdate(data.project)
      }

      setShowUploadForm(true)
      setNotes('')
      toast.success('Contrato de obra eliminado exitosamente')
    } catch (error) {
      console.error('Error deleting construction contract:', error)
      toast.error('Error al eliminar el contrato. Por favor, inténtalo de nuevo.')
    }
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
          construction_contract_notes: notes.trim() || null
        }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar las notas')
      }

      const data = await response.json()

      if (onProjectUpdate) {
        onProjectUpdate(data.project)
      }

      toast.success('Notas actualizadas exitosamente')
    } catch (error) {
      console.error('Error updating construction contract notes:', error)
      toast.error('Error al actualizar las notas. Por favor, inténtalo de nuevo.')
    }
  }

  const openFile = () => {
    if (project.construction_contract_file_url) {
      window.open(project.construction_contract_file_url, '_blank')
    }
  }

  const downloadFile = () => {
    if (project.construction_contract_file_url) {
      const link = document.createElement('a')
      link.href = project.construction_contract_file_url
      const extension = project.construction_contract_file_url.split('.').pop() || 'pdf'
      link.download = `contrato-obra-${project.name || project.id}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Determinar icono y color de estado (sin lógica de vencimiento)
  const hasContract = !!project.construction_contract_file_url
  const StatusIcon = hasContract ? CheckCircle : AlertTriangle
  const statusColor = hasContract ? 'text-green-600' : 'text-yellow-600'

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-primary/10 ${statusColor}`}>
            <StatusIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-foreground">
              Contrato de Obra
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Contrato de obra del proyecto de construcción
            </p>
          </div>
          <Badge variant={hasContract ? 'default' : 'secondary'}>
            {hasContract ? 'Cargado' : 'Pendiente'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Estado actual del contrato */}
        {project.construction_contract_file_url ? (
          <div className="space-y-4">
            {/* Información del archivo actual */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground">Contrato actual</h4>
                    {project.construction_contract_upload_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        Fecha del documento: {new Date(project.construction_contract_upload_date).toLocaleDateString('es-AR')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-start">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openFile}
                    className="text-primary hover:text-primary text-xs px-2 py-1 h-7"
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
                    onClick={handleDeleteContract}
                    className="text-destructive hover:text-destructive text-xs px-2 py-1 h-7"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>

            {/* Notas del contrato */}
            <div className="space-y-3">
              <Label htmlFor="contract-notes" className="text-sm font-medium text-muted-foreground">
                Notas adicionales
              </Label>
              <Textarea
                id="contract-notes"
                placeholder="Agregar notas sobre el contrato de obra..."
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

            <div className="bg-yellow-500/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Pendiente</span>
              </div>
              <p className="text-sm text-yellow-600 dark:text-yellow-500">
                Se requiere subir el contrato de obra para el proyecto.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="contract-document-date" className="text-sm font-medium text-muted-foreground">
                  Fecha del documento *
                </Label>
                <Input
                  id="contract-document-date"
                  type="date"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                  className="mt-1"
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ingresa la fecha que aparece en el contrato
                </p>
              </div>

              <div>
                <Label htmlFor="contract-file-upload" className="text-sm font-medium text-muted-foreground">
                  Archivo (PDF, DOC, DOCX) *
                </Label>
                <div className="mt-1">
                  {!selectedFile ? (
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-muted-foreground transition-colors">
                      <input
                        ref={fileInputRef}
                        id="contract-file-upload"
                        type="file"
                        accept={acceptedFileTypes}
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
                      <p className="text-sm text-muted-foreground mt-2">
                        PDF, DOC o DOCX (máx. 10MB)
                      </p>
                    </div>
                  ) : (
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelFile}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="contract-notes-upload" className="text-sm font-medium text-muted-foreground">
                  Notas adicionales
                </Label>
                <Textarea
                  id="contract-notes-upload"
                  placeholder="Agregar notas sobre el contrato de obra..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 min-h-[80px] resize-none"
                />
              </div>

              <Button
                onClick={handleConfirmUpload}
                disabled={!selectedFile || uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo contrato...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir contrato
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
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
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
