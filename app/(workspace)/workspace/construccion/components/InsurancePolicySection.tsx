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
  Shield,
  Upload,
  Download,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  RefreshCw,
  Trash2,
  Building
} from 'lucide-react'
import { Project, formatInsurancePolicyStatus, calculateInsurancePolicyDaysRemaining } from '@/lib/construction'
import { useDirectFileUpload } from '@/lib/hooks/useDirectFileUpload'
import { useWorkspace } from '@/components/workspace-context'
import { sanitizeFileName, generateUniqueFilePath } from '@/lib/utils/file-utils'
import { toast } from 'sonner'

interface InsurancePolicySectionProps {
  project: Project
  onProjectUpdate?: (updatedProject: Project) => void
}

export default function InsurancePolicySection({ project, onProjectUpdate }: InsurancePolicySectionProps) {
  const [uploading, setUploading] = useState(false)

  // Hook para obtener el workspace actual
  const { companyId } = useWorkspace()

  // Hook para manejar subidas de archivos con Supabase Storage
  const { uploadFile, progress: hookUploadProgress, isUploading: hookIsUploading } = useDirectFileUpload()

  const handleUploadSuccess = async (fileUrl: string, fileName: string) => {
      try {
        // Usar las fechas ingresadas por el usuario
        const issueDateISO = new Date(issueDate + 'T12:00:00').toISOString()
        const expiryDateISO = new Date(expiryDate + 'T12:00:00').toISOString()

        // Actualizar proyecto con nueva póliza
        const response = await fetch('/api/workspace/construction/projects', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: project.id,
            insurance_policy_file_url: fileUrl,
            insurance_policy_issue_date: issueDateISO,
            insurance_policy_expiry_date: expiryDateISO,
            insurance_policy_notes: notes.trim() || null,
            insurance_policy_number: policyNumber.trim() || null,
            insurance_company: insuranceCompany.trim() || null
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

        toast.success(`Póliza de seguro subida exitosamente. Emisión: ${new Date(issueDate).toLocaleDateString('es-AR')}. Válida hasta: ${new Date(expiryDate).toLocaleDateString('es-AR')}. Aseguradora: ${insuranceCompany}. Número: ${policyNumber}`)
      } catch (error) {
        console.error('Error updating project with insurance policy:', error)
        toast.error('Error al actualizar el proyecto con la póliza. Por favor, inténtalo de nuevo.')
      }
  }

  const handleUploadError = (error: string) => {
      toast.error(`Error al subir la póliza de seguro: ${error}`)
    }

  // Sincronizar estado del hook con estado local
  useEffect(() => {
    setUploading(hookIsUploading)
  }, [hookIsUploading])

  const [notes, setNotes] = useState(project.insurance_policy_notes || '')
  const [showUploadForm, setShowUploadForm] = useState(!project.insurance_policy_file_url)
  const [issueDate, setIssueDate] = useState(
    project.insurance_policy_issue_date
      ? new Date(project.insurance_policy_issue_date).toISOString().split('T')[0]
      : ''
  )
  const [expiryDate, setExpiryDate] = useState(
    project.insurance_policy_expiry_date
      ? new Date(project.insurance_policy_expiry_date).toISOString().split('T')[0]
      : ''
  )
  const [policyNumber, setPolicyNumber] = useState(project.insurance_policy_number || '')
  const [insuranceCompany, setInsuranceCompany] = useState(project.insurance_company || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Calcular estado de la póliza
  const policyStatus = formatInsurancePolicyStatus(project.insurance_policy_expiry_date || null)

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validar que las fechas estén completas
    if (!issueDate || !expiryDate) {
      toast.error('Debes ingresar tanto la fecha de emisión como la fecha de vencimiento.')
      return
    }

    // Validar que la fecha de emisión no sea futura
    const issueDateObj = new Date(issueDate)
    const expiryDateObj = new Date(expiryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (issueDateObj > today) {
      toast.error('La fecha de emisión no puede ser futura.')
      return
    }

    // Validar que la fecha de vencimiento sea posterior a la de emisión
    if (expiryDateObj <= issueDateObj) {
      toast.error('La fecha de vencimiento debe ser posterior a la fecha de emisión.')
      return
    }

    try {
      // Validar que companyId esté disponible
      if (!companyId) {
        throw new Error('Faltan datos requeridos para Supabase Storage: companyId no disponible')
      }

      // Generar ruta única para el archivo
      const path = generateUniqueFilePath({
        companyId: companyId,
        projectId: project.id,
        section: 'insurance-policies',
        fileName: file.name
      })

      // Subir archivo usando el sistema de upload directo a Supabase Storage
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
      console.error('Error uploading insurance policy:', error)
      handleUploadError(error instanceof Error ? error.message : 'Error desconocido')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar que se hayan ingresado las fechas
    if (!issueDate || !expiryDate) {
      toast.error('Debes ingresar las fechas de emisión y vencimiento antes de seleccionar el archivo.')
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

  const handleDownload = (): void => {
    if (project.insurance_policy_file_url) {
      window.open(project.insurance_policy_file_url, '_blank')
    }
  }

  const handleNewUpload = (): void => {
    setShowUploadForm(true)
    setSelectedFile(null)
    setNotes(project.insurance_policy_notes || '')
    setIssueDate(
      project.insurance_policy_issue_date
        ? new Date(project.insurance_policy_issue_date).toISOString().split('T')[0]
        : ''
    )
    setExpiryDate(
      project.insurance_policy_expiry_date
        ? new Date(project.insurance_policy_expiry_date).toISOString().split('T')[0]
        : ''
    )
    setPolicyNumber(project.insurance_policy_number || '')
    setInsuranceCompany(project.insurance_company || '')
  }

  const handleDeletePolicy = async () => {
    const confirmDelete = window.confirm(
      '¿Estás seguro de que quieres eliminar esta póliza de seguro?\n\nEsta acción no se puede deshacer.'
    )

    if (!confirmDelete) return

    try {
      const response = await fetch('/api/workspace/construction/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: project.id,
          insurance_policy_file_url: null,
          insurance_policy_issue_date: null,
          insurance_policy_expiry_date: null,
          insurance_policy_notes: null,
          insurance_policy_number: null,
          insurance_company: null
        }),
      })

      if (!response.ok) {
        throw new Error('Error al eliminar la póliza')
      }

      const data = await response.json()

      if (onProjectUpdate) {
        onProjectUpdate(data.project)
      }

      setShowUploadForm(true)
      toast.success('Póliza de seguro eliminada exitosamente')
    } catch (error) {
      console.error('Error deleting insurance policy:', error)
      toast.error('Error al eliminar la póliza. Por favor, inténtalo de nuevo.')
    }
  }

  return (
    <div className="space-y-4">
      {project.insurance_policy_file_url && !showUploadForm ? (
          // Vista cuando ya existe una póliza
          <div className="space-y-4">
            {/* Estado de la póliza */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Estado de la Póliza</span>
              </div>
              <Badge
                variant={policyStatus.status === 'valid' ? 'default' :
                        policyStatus.status === 'expiring' ? 'destructive' : 'secondary'}
                className="flex items-center gap-1"
              >
                {policyStatus.status === 'valid' && <CheckCircle className="h-3 w-3" />}
                {policyStatus.status === 'expiring' && <AlertTriangle className="h-3 w-3" />}
                {policyStatus.status === 'expired' && <Clock className="h-3 w-3" />}
                {policyStatus.message}
              </Badge>
            </div>

            {/* Información de la póliza */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              {project.insurance_policy_issue_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Emisión</p>
                    <p className="font-medium">
                      {new Date(project.insurance_policy_issue_date).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
              )}

              {project.insurance_policy_expiry_date && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Vencimiento</p>
                    <p className="font-medium">
                      {new Date(project.insurance_policy_expiry_date).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
              )}

              {project.insurance_company && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Aseguradora</p>
                    <p className="font-medium">{project.insurance_company}</p>
                  </div>
                </div>
              )}

              {project.insurance_policy_number && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Número de Póliza</p>
                    <p className="font-medium">{project.insurance_policy_number}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Notas */}
            {project.insurance_policy_notes && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Notas</p>
                <p className="text-sm">{project.insurance_policy_notes}</p>
              </div>
            )}

            {/* Acciones */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar
              </Button>

              <Button
                onClick={() => project.insurance_policy_file_url && window.open(project.insurance_policy_file_url, '_blank')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Ver
              </Button>

              <Button
                onClick={handleNewUpload}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {project.insurance_policy_file_url ? 'Subir Nueva Póliza' : 'Subir Póliza de Seguro'}
              </Button>

              <Button
                onClick={handleDeletePolicy}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            </div>
          </div>
        ) : (
          // Formulario de subida
          <div className="space-y-6">
            {/* Header mejorado sin borde punteado */}
            <div className="text-center p-6 bg-primary/10 rounded-xl border border-primary/30">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {project.insurance_policy_file_url ? 'Actualizar Póliza de Seguro' : 'Agregar Póliza de Seguro'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Complete la información de la póliza y suba el documento en formato PDF para mantener actualizada la cobertura del proyecto
              </p>
            </div>

            {/* Campos del formulario */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issueDate">Fecha de Emisión *</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="expiryDate">Fecha de Vencimiento *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="insuranceCompany">Aseguradora</Label>
                <Input
                  id="insuranceCompany"
                  type="text"
                  value={insuranceCompany}
                  onChange={(e) => setInsuranceCompany(e.target.value)}
                  placeholder="Ej: La Caja ART"
                />
              </div>

              <div>
                <Label htmlFor="policyNumber">Número de Póliza</Label>
                <Input
                  id="policyNumber"
                  type="text"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  placeholder="Ej: 123456789"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales sobre la póliza..."
                rows={3}
              />
            </div>

            <Separator />

            {/* Selección de archivo mejorada */}
            <div className="space-y-3">
              <Label htmlFor="file" className="text-base font-medium">Archivo de la Póliza (PDF) *</Label>

              {!selectedFile ? (
                <div className="relative">
                  <Input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex items-center justify-center p-6 bg-muted/50 border-2 border-border border-solid rounded-lg hover:bg-muted hover:border-primary/30 transition-all duration-200 cursor-pointer">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Haga clic para seleccionar archivo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Solo archivos PDF - Máximo 20MB
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-500/10 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-emerald-500/10 rounded-full">
                        <Shield className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleCancelFile}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Progreso de subida */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Subiendo póliza...</span>
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

            {/* Botones de acción */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleConfirmUpload}
                disabled={!selectedFile || uploading || !issueDate || !expiryDate}
                size="sm"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {uploading ? 'Subiendo...' : 'Subir Póliza'}
              </Button>

              {showUploadForm && project.insurance_policy_file_url && (
                <Button
                  onClick={() => setShowUploadForm(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
