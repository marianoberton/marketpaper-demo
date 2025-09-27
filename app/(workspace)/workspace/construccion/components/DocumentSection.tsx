'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Upload, Calendar, FileText, Check, X, FileImage, FileSpreadsheet, File } from 'lucide-react'
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
  calculateExpirationDate, 
  calculateDaysUntilExpiration,
  getTodayInputValue 
} from '@/lib/utils/date-utils'
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
}

  // Función para calcular días restantes hasta el vencimiento basado en fecha de carga
  const calculateDaysRemaining = (uploadDate: string): { days: number; isExpired: boolean; isExpiringSoon: boolean } => {
    if (!uploadDate) {
      return { days: 0, isExpired: false, isExpiringSoon: false };
    }
    
    try {
      // Calcular fecha de vencimiento (1 año después de la fecha de carga)
      const expirationDate = calculateExpirationDate(uploadDate);
      return calculateDaysUntilExpiration(expirationDate);
    } catch (error) {
      console.error('Error calculating days remaining:', error);
      return { days: 0, isExpired: false, isExpiringSoon: false };
    }
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
  savedUploadDate
}: DocumentSectionProps) {
  const [dragOver, setDragOver] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<DisplayDocument | null>(null)
  const inputId = `file-input-${sectionName.replace(/[^a-zA-Z0-9_-]/g, '-')}`

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
        ? 'ring-2 ring-gray-200' 
        : hasDocuments 
          ? 'ring-2 ring-green-200' 
          : ''
    }`}>
      {/* Header de la tira */}
      <div 
        className={`p-4 cursor-pointer transition-all duration-200 ${
          noDocumentationRequired
            ? 'bg-gray-100 border-b border-gray-200'
            : hasDocuments 
              ? 'bg-green-50 border-b border-green-200' 
              : isExpanded 
                ? 'bg-blue-50 border-b' 
                : 'hover:bg-gray-50'
        }`}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
            
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">{title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Contador de documentos mejorado */}
            {hasDocuments && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3 text-gray-500" />
                  <Badge 
                    variant={documents.length > 0 ? "default" : "secondary"} 
                    className={`text-xs font-medium ${
                      documents.length > 5 ? 'bg-green-100 text-green-800 border-green-200' :
                      documents.length > 2 ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      'bg-gray-100 text-gray-800 border-gray-200'
                    }`}
                  >
                    {documents.length}
                  </Badge>
                </div>
              </div>
            )}
            {/* Mostrar badge incluso cuando no hay documentos para indicar sección vacía */}
            {!hasDocuments && (
              <Badge variant="outline" className="text-xs text-gray-400 border-gray-200">
                Vacío
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Contenido expandible */}
       {isExpanded && (
         <div className="p-4 space-y-4 bg-white">
           {/* Checkbox "No requiere documentación" */}
           {showNoDocumentationCheckbox && (
             <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border">
               <Checkbox
                 id={`no-docs-${sectionName}`}
                 checked={noDocumentationRequired}
                 onCheckedChange={(checked) => onNoDocumentationChange?.(checked as boolean)}
               />
               <Label 
                 htmlFor={`no-docs-${sectionName}`}
                 className="text-sm font-medium text-gray-700 cursor-pointer"
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
                     ? 'border-blue-400 bg-blue-50 scale-[1.02]' 
                     : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
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
                     ${dragOver ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}
                   `}>
                     <Upload className="h-5 w-5" />
                   </div>
                   <div>
                     <p className="text-sm font-medium text-gray-700">
                       {noDocumentationRequired 
                         ? 'Carga deshabilitada' 
                         : dragOver 
                           ? 'Suelta los archivos aquí' 
                           : 'Arrastra archivos aquí o haz clic'
                       }
                     </p>
                     <p className="text-xs text-gray-500 mt-1">
                       Formatos: .pdf, .png, .jpg, .docx • Máximo 100MB
                     </p>
                   </div>
                 </div>
               </div>
     
               {/* Barra de progreso mejorada */}
               {uploadProgress > 0 && uploadProgress < 100 && !noDocumentationRequired && (
                 <div className="mt-3 space-y-2">
                   <div className="flex items-center justify-between text-sm">
                     <span className="text-gray-600">Subiendo archivo...</span>
                     <span className="text-gray-500">{uploadProgress}%</span>
                   </div>
                   <Progress value={uploadProgress} className="h-2" />
                 </div>
               )}
             </div>

             {/* Espacio para información adicional */}
             <div className="flex-1">
               {/* Campo fecha de carga */}
               {showExpirationDate && (
                 <div className="space-y-2">
                   <div className="flex items-center justify-between">
                     <Label htmlFor={`upload-date-${sectionName}`} className="text-sm font-medium text-gray-700">
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
                     <Calendar className="h-4 w-4 text-gray-500" />
                     <Input
                       id={`upload-date-${sectionName}`}
                       type="date"
                       value={uploadDate}
                       onChange={(e) => onUploadDateChange?.(e.target.value)}
                       className="flex-1"
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
                     >
                       {isSavingDate ? 'Guardando...' : 'Guardar'}
                     </Button>
                   </div>
                   {savedUploadDate && (
                     <div className="space-y-2">
                       <div className="flex items-center gap-2 text-sm text-green-600">
                         <Check className="h-4 w-4" />
                         <span>Fecha de carga: {formatArgentinaDate(savedUploadDate)}</span>
                       </div>
                       <div className="text-sm text-gray-600">
                         <span>Vence: {formatArgentinaDate(calculateExpirationDate(savedUploadDate))}</span>
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
             </div>
           </div>
   
           {/* Lista de documentos mejorada */}
           {hasDocuments && (
             <div className="mt-6 space-y-3">
               <div className="flex items-center gap-2 mb-4">
                 <FileText className="h-4 w-4 text-gray-500" />
                 <h4 className="text-sm font-medium text-gray-700">Documentos cargados</h4>
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
                           <p className="text-sm font-medium text-gray-900 truncate">
                             {doc.name}
                           </p>
                           <div className="flex items-center gap-4 mt-1">
                             <span className="text-xs text-gray-500">
                               {formatFileSize(doc.size)}
                             </span>
                             <div className="flex items-center gap-1 text-xs text-gray-500">
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
                           className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                         >
                           Ver
                         </Button>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => onDocumentDelete(doc.id)}
                           className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
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
  return <File className="h-4 w-4 text-gray-600" />
}

// Función para obtener el color de fondo según el tipo de documento
const getDocumentBgColor = (fileName: string, type: string) => {
  const extension = fileName.toLowerCase().split('.').pop()
  
  if (type.includes('pdf') || extension === 'pdf') {
    return 'bg-red-50'
  }
  
  if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension || '')) {
    return 'bg-green-50'
  }
  
  if (type.includes('word') || type.includes('document') || ['doc', 'docx'].includes(extension || '')) {
    return 'bg-blue-50'
  }
  
  if (type.includes('excel') || type.includes('spreadsheet') || ['xls', 'xlsx'].includes(extension || '')) {
    return 'bg-green-50'
  }
  
  return 'bg-gray-50'
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
      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border">
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