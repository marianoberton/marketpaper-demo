'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Upload, Calendar, FileText, Check, X, FileImage, FileSpreadsheet, File, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatFileSize } from '@/lib/storage'
import {
  formatArgentinaDate,
  calculateDaysUntilExpiration,
  getTodayInputValue
} from '@/lib/utils/date-utils'
import { calculateExpirationDate } from '@/lib/document-expiration-config'
import DocumentPreviewModal from './DocumentPreviewModal'

// Tipo de documento que el componente realmente renderiza
type DisplayDocument = {
  id: string
  name: string
  size: number
  type: string
  uploadDate: string
  url: string
}

interface DocumentSectionProps {
  title: string
  sectionName: string
  projectId: string
  documents: DisplayDocument[]
  isExpanded: boolean
  onToggle: () => void
  onFileUpload: (files: FileList, sectionName: string) => void
  onDocumentDelete: (documentId: string) => void
  // Estado de carga
  isUploading?: boolean
  uploadProgress?: number
  // Configuración de archivos
  acceptedFileTypes?: string[]
  maxFileSize?: number
  // Checkbox "No requiere documentación"
  showNoDocumentationCheckbox?: boolean
  noDocumentationLabel?: string
  noDocumentationRequired?: boolean
  onNoDocumentationChange?: (checked: boolean) => void
  // Campo fecha de carga (cambio de lógica)
  showExpirationDate?: boolean
  expirationDateLabel?: string
  uploadDate?: string // Cambio: ahora es fecha de carga
  onUploadDateChange?: (date: string) => void // Cambio: maneja fecha de carga
  onSaveUploadDate?: (sectionName: string, date: string) => void // Cambio: guarda fecha de carga
  onSetOneYearExpiration?: (sectionName: string) => void
  isSavingDate?: boolean
  savedUploadDate?: string // Cambio: fecha de carga guardada
  // Nuevas props para el sistema de etapas completadas
  isStageCompleted?: boolean
  onStageCompletionToggle?: (sectionName: string, completed: boolean) => void
  isTogglingCompletion?: boolean
}

export default function DocumentSection({
  title,
  sectionName,
  projectId,
  documents,
  isExpanded,
  onToggle,
  onFileUpload,
  onDocumentDelete,
  isUploading = false,
  uploadProgress = 0,
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
  maxFileSize = 100,
  showNoDocumentationCheckbox = false,
  noDocumentationLabel = "No requiere documentación",
  noDocumentationRequired = false,
  onNoDocumentationChange,
  showExpirationDate = false,
  expirationDateLabel = "Fecha de carga",
  uploadDate = "",
  onUploadDateChange,
  onSaveUploadDate,
  onSetOneYearExpiration,
  isSavingDate = false,
  savedUploadDate,
  // Nuevas props para el sistema de etapas completadas
  isStageCompleted = false,
  onStageCompletionToggle,
  isTogglingCompletion = false
}: DocumentSectionProps) {
  const [dragOver, setDragOver] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<DisplayDocument | null>(null)
  const inputId = `file-input-${sectionName.replace(/[^a-zA-Z0-9_-]/g, '-')}`

  // Función para calcular días restantes hasta el vencimiento basado en fecha de carga
  const calculateDaysRemaining = (uploadDate: string): { days: number; isExpired: boolean; isExpiringSoon: boolean } => {
    if (!uploadDate) {
      return { days: 0, isExpired: false, isExpiringSoon: false };
    }

    try {
      // Calcular fecha de vencimiento usando la configuración específica por tipo de documento
      const expirationDate = calculateExpirationDate(uploadDate, sectionName);
      return calculateDaysUntilExpiration(expirationDate);
    } catch (error) {
      console.error('Error calculating days remaining:', error);
      return { days: 0, isExpired: false, isExpiringSoon: false };
    }
  }

  // Calcular días restantes para mostrar en el contador
  const daysInfo = savedUploadDate ? calculateDaysRemaining(savedUploadDate) : null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileUpload(files, sectionName)
    }
    // Reset input
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      onFileUpload(files, sectionName)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('image')) return '🖼️'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    return '📎'
  }

  const hasDocuments = documents.length > 0

  return (
    <Card className={`mb-3 overflow-hidden transition-all duration-200 hover:shadow-md ${
      noDocumentationRequired
        ? 'ring-2 ring-border'
        : hasDocuments
          ? 'ring-2 ring-emerald-500/30'
          : ''
    }`}>
      {/* Header con título y controles */}
      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="p-1 h-auto"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            <div className="flex items-center gap-3">
              <h3 className={`text-sm font-medium ${isStageCompleted ? 'text-green-700 dark:text-green-400' : 'text-foreground'}`}>
                {title}
              </h3>

              {/* Botón de check para marcar etapa como completada */}
              {onStageCompletionToggle && (
                <Button
                  variant={isStageCompleted ? "default" : "outline"}
                  size="sm"
                  onClick={() => onStageCompletionToggle(sectionName, !isStageCompleted)}
                  disabled={isTogglingCompletion}
                  className={`
                    flex items-center gap-2 text-xs px-3 py-1 h-7
                    ${isStageCompleted
                      ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                      : 'text-muted-foreground hover:text-green-600 hover:border-green-300'
                    }
                  `}
                  title={isStageCompleted ? "Marcar como pendiente" : "Marcar como completada"}
                >
                  {isTogglingCompletion ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className={`h-3 w-3 ${isStageCompleted ? 'fill-current' : ''}`} />
                  )}
                  <span className="font-medium">
                    {isStageCompleted ? 'Completada' : 'Marcar completada'}
                  </span>
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Badge de estado de documentos */}
            {hasDocuments && (
              <Badge variant="secondary" className="text-xs">
                {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
              </Badge>
            )}
            {/* Mostrar badge incluso cuando no hay documentos para indicar sección vacía */}
            {!hasDocuments && (
              <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                Vacío
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Contenido expandible */}
       {isExpanded && (
         <div className="p-4 space-y-4 bg-card">
           {/* Checkbox "No requiere documentación" */}
           {showNoDocumentationCheckbox && (
             <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg border">
               <Checkbox
                 id={`no-docs-${sectionName}`}
                 checked={noDocumentationRequired}
                 onCheckedChange={(checked) => onNoDocumentationChange?.(checked as boolean)}
               />
               <Label
                 htmlFor={`no-docs-${sectionName}`}
                 className="text-sm font-medium text-muted-foreground cursor-pointer"
               >
                 {noDocumentationLabel}
               </Label>
             </div>
           )}

           {/* Contenedor principal con layout flex */}
           <div className="flex gap-6">
             {/* Dropzone con ancho reducido */}
             <div className="flex-1 max-w-md">
               <div
                 className={`
                   relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200
                   ${dragOver
                     ? 'border-primary bg-primary/10 scale-[1.02]'
                     : 'border-border hover:border-muted-foreground hover:bg-muted/50'
                   }
                   ${uploadProgress > 0 && uploadProgress < 100 ? 'pointer-events-none opacity-60' : ''}
                   ${noDocumentationRequired ? 'opacity-50 pointer-events-none' : ''}
                 `}
                 onDrop={handleDrop}
                 onDragOver={handleDragOver}
                 onDragLeave={handleDragLeave}
                 onClick={() => !noDocumentationRequired && document.getElementById(inputId)?.click()}
                 role="button"
                 tabIndex={0}
                 onKeyDown={(e) => {
                   if ((e.key === 'Enter' || e.key === ' ') && !noDocumentationRequired) {
                     e.preventDefault()
                     document.getElementById(inputId)?.click()
                   }
                 }}
               >
                 <input
                   type="file"
                   multiple
                   accept={acceptedFileTypes.join(',')}
                   onChange={handleFileSelect}
                   className="hidden"
                   id={inputId}
                   disabled={isUploading || noDocumentationRequired}
                 />
                 <div className="flex flex-col items-center gap-2">
                   <div className={`
                     p-2 rounded-full transition-colors duration-200
                     ${dragOver ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                   `}>
                     <Upload className="h-5 w-5" />
                   </div>
                   <div>
                     <p className="text-sm font-medium text-muted-foreground">
                       {noDocumentationRequired
                         ? 'Carga deshabilitada'
                         : dragOver
                           ? 'Suelta los archivos aquí'
                           : 'Arrastra archivos aquí o haz clic'
                       }
                     </p>
                     <p className="text-xs text-muted-foreground mt-1">
                       Formatos: .pdf, .png, .jpg, .docx • Máximo 100MB
                     </p>
                   </div>
                 </div>
               </div>

               {/* Barra de progreso mejorada */}
               {uploadProgress > 0 && uploadProgress < 100 && !noDocumentationRequired && (
                 <div className="mt-3 space-y-2">
                   <div className="flex items-center justify-between text-sm">
                     <span className="text-muted-foreground">Subiendo archivo...</span>
                     <span className="text-muted-foreground">{uploadProgress}%</span>
                   </div>
                   <Progress value={uploadProgress} className="h-2" />
                 </div>
               )}
             </div>

             {/* Espacio para información adicional */}
             <div className="flex-1">
               {/* Campo fecha de carga - Solo mostrar si la etapa NO está completada */}
               {showExpirationDate && !isStageCompleted && (
                 <div className="space-y-2">
                   <div className="flex items-center justify-between">
                     <Label htmlFor={`upload-date-${sectionName}`} className="text-sm font-medium text-muted-foreground">
                       {expirationDateLabel}
                     </Label>
                     <Button
                       onClick={() => onSetOneYearExpiration?.(sectionName)}
                       variant="outline"
                       size="sm"
                       className="text-xs px-2 py-1 h-6"
                       title="Establecer fecha de hoy (vence en 1 año)"
                     >
                       Hoy
                     </Button>
                   </div>
                   <div className="flex items-center gap-2">
                     <Calendar className="h-4 w-4 text-muted-foreground" />
                     <Input
                       id={`upload-date-${sectionName}`}
                       type="date"
                       value={uploadDate}
                       onChange={(e) => onUploadDateChange?.(e.target.value)}
                       className={`flex-1 ${savedUploadDate ? 'border-green-300 bg-emerald-500/10' : ''}`}
                       placeholder="Seleccionar fecha de carga"
                       max={getTodayInputValue()}
                     />
                     <Button
                       onClick={() => {
                         if (uploadDate && onSaveUploadDate) {
                           onSaveUploadDate(sectionName, uploadDate)
                         }
                       }}
                       disabled={!uploadDate || isSavingDate}
                       size="sm"
                       className="px-3"
                       variant={savedUploadDate ? "outline" : "default"}
                     >
                       {isSavingDate ? 'Guardando...' : (savedUploadDate ? 'Editar fecha' : 'Guardar')}
                     </Button>
                   </div>
                   {savedUploadDate && (
                     <div className="p-3 bg-emerald-500/10 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
                       <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 font-medium">
                         <Check className="h-4 w-4" />
                         <span>Fecha de carga guardada: {formatArgentinaDate(savedUploadDate)}</span>
                       </div>
                       <div className="text-sm text-muted-foreground">
                         <span>Vence: {formatArgentinaDate(calculateExpirationDate(savedUploadDate, sectionName))}</span>
                         {daysInfo && (
                           <Badge
                             variant={daysInfo.isExpired ? "destructive" : daysInfo.isExpiringSoon ? "secondary" : "outline"}
                             className="ml-2"
                           >
                             {daysInfo.isExpired
                               ? `Vencido hace ${Math.abs(daysInfo.days)} días`
                               : `${daysInfo.days} días restantes`
                             }
                           </Badge>
                         )}
                       </div>
                     </div>
                   )}
                 </div>
               )}

               {/* Mensaje cuando la etapa está completada */}
               {isStageCompleted && (
                 <div className="p-3 bg-emerald-500/10 border border-green-200 dark:border-green-800 rounded-lg">
                   <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                     <CheckCircle2 className="h-4 w-4" />
                     <span className="font-medium">Etapa completada</span>
                   </div>
                   <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                     Las fechas de vigencia están ocultas para esta etapa.
                   </p>
                 </div>
               )}
             </div>
           </div>

           {/* Lista de documentos mejorada */}
           {hasDocuments && (
             <div className="mt-6 space-y-3">
               <div className="flex items-center gap-2 mb-4">
                 <FileText className="h-4 w-4 text-muted-foreground" />
                 <h4 className="text-sm font-medium text-muted-foreground">Documentos cargados</h4>
                 <Badge variant="secondary" className="text-xs">
                   {documents.length}
                 </Badge>
               </div>

               <div className="space-y-2">
                 {documents.map((doc) => (
                   <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow duration-200">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3 flex-1 min-w-0">
                         <DocumentThumbnail doc={doc} />
                         <div className="flex-1 min-w-0">
                           <p className="text-sm font-medium text-foreground truncate">
                             {doc.name}
                           </p>
                           <div className="flex items-center gap-4 mt-1">
                             <span className="text-xs text-muted-foreground">
                               {formatFileSize(doc.size)}
                             </span>
                             <div className="flex items-center gap-1 text-xs text-muted-foreground">
                               <Calendar className="h-3 w-3" />
                               {new Date(doc.uploadDate).toLocaleDateString('es-ES', {
                                 day: '2-digit',
                                 month: '2-digit',
                                 year: 'numeric',
                                 hour: '2-digit',
                                 minute: '2-digit'
                               })}
                             </div>
                           </div>
                         </div>
                       </div>

                       <div className="flex items-center gap-2 ml-4">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => setPreviewDocument(doc)}
                           className="text-primary hover:text-primary hover:bg-primary/10 border-primary/30"
                         >
                           Ver
                         </Button>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => onDocumentDelete(doc.id)}
                           className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                         >
                           <X className="h-4 w-4" />
                         </Button>
                       </div>
                     </div>
                   </Card>
                 ))}
               </div>
             </div>
           )}
         </div>
       )}

       {/* Modal de previsualización */}
       <DocumentPreviewModal
         isOpen={!!previewDocument}
         onClose={() => setPreviewDocument(null)}
         document={previewDocument}
       />
     </Card>
    )
}

// Función para obtener el icono según el tipo de documento
const getDocumentIcon = (fileName: string, type: string) => {
  const extension = fileName.toLowerCase().split('.').pop()

  // Iconos específicos por tipo de archivo
  if (type.includes('pdf') || extension === 'pdf') {
    return <FileText className="h-4 w-4 text-red-600" />
  }

  if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension || '')) {
    return <FileImage className="h-4 w-4 text-green-600" />
  }

  if (type.includes('word') || type.includes('document') || ['doc', 'docx'].includes(extension || '')) {
    return <FileText className="h-4 w-4 text-blue-600" />
  }

  if (type.includes('excel') || type.includes('spreadsheet') || ['xls', 'xlsx'].includes(extension || '')) {
    return <FileSpreadsheet className="h-4 w-4 text-green-700" />
  }

  // Icono por defecto
  return <File className="h-4 w-4 text-muted-foreground" />
}

// Función para obtener el color de fondo según el tipo de documento
const getDocumentBgColor = (fileName: string, type: string) => {
  const extension = fileName.toLowerCase().split('.').pop()

  if (type.includes('pdf') || extension === 'pdf') {
    return 'bg-destructive/10'
  }

  if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension || '')) {
    return 'bg-emerald-500/10'
  }

  if (type.includes('word') || type.includes('document') || ['doc', 'docx'].includes(extension || '')) {
    return 'bg-primary/10'
  }

  if (type.includes('excel') || type.includes('spreadsheet') || ['xls', 'xlsx'].includes(extension || '')) {
    return 'bg-emerald-500/10'
  }

  return 'bg-muted/50'
}

// Función para determinar si un documento puede mostrar miniatura
const canShowThumbnail = (fileName: string, type: string) => {
  const extension = fileName.toLowerCase().split('.').pop()
  return type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension || '')
}

// Componente de miniatura de documento
const DocumentThumbnail = ({ doc }: { doc: DisplayDocument }) => {
  if (canShowThumbnail(doc.name, doc.type)) {
    return (
      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted border">
        <img
          src={doc.url}
          alt={doc.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Si falla la carga de la imagen, mostrar el icono por defecto
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            target.nextElementSibling?.classList.remove('hidden')
          }}
        />
        <div className={`hidden absolute inset-0 flex items-center justify-center ${getDocumentBgColor(doc.name, doc.type)}`}>
          {getDocumentIcon(doc.name, doc.type)}
        </div>
      </div>
    )
  }

  return (
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getDocumentBgColor(doc.name, doc.type)}`}>
      {getDocumentIcon(doc.name, doc.type)}
    </div>
  )
}
