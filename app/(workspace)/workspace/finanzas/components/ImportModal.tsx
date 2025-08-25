'use client'

import { useState, useRef, useEffect } from 'react'
import { useDirectFileUpload } from '@/lib/hooks/useDirectFileUpload'
import { useWorkspace } from '@/components/workspace-context'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Upload, FileText, CreditCard, AlertCircle, CheckCircle, X, Download, FileSpreadsheet, Image, FileCheck, Zap, Brain, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImportModalProps {
  onImport: (file: File, fileType: string) => void
  onCancel: () => void
}

const FILE_TYPES = [
  { 
    value: 'credit_card', 
    label: 'Resumen de Tarjeta de Crédito',
    icon: '💳',
    description: 'Archivo PDF o Excel con movimientos de tarjeta de crédito',
    supportedFormats: ['PDF', 'Excel', 'CSV']
  },
  { 
    value: 'bank_statement', 
    label: 'Extracto Bancario',
    icon: '🏦',
    description: 'Movimientos de cuenta bancaria o caja de ahorro',
    supportedFormats: ['PDF', 'Excel', 'CSV']
  },
  { 
    value: 'receipt', 
    label: 'Recibos/Comprobantes',
    icon: '🧾',
    description: 'Imágenes de recibos, tickets o comprobantes',
    supportedFormats: ['JPG', 'PNG', 'PDF']
  },
  { 
    value: 'other', 
    label: 'Otros',
    icon: '📄',
    description: 'Otros tipos de archivos financieros',
    supportedFormats: ['PDF', 'Excel', 'CSV', 'TXT']
  }
]

const PROCESSING_FEATURES = [
  {
    icon: <Brain className="h-5 w-5 text-blue-600" />,
    title: 'Extracción Inteligente',
    description: 'IA extrae automáticamente fechas, montos y descripciones'
  },
  {
    icon: <Target className="h-5 w-5 text-green-600" />,
    title: 'Categorización Automática',
    description: 'Asigna categorías basadas en patrones de gasto'
  },
  {
    icon: <Zap className="h-5 w-5 text-purple-600" />,
    title: 'Detección de Duplicados',
    description: 'Evita gastos duplicados comparando con registros existentes'
  },
  {
    icon: <FileCheck className="h-5 w-5 text-orange-600" />,
    title: 'Validación de Datos',
    description: 'Verifica la consistencia de montos y fechas'
  }
]

export default function ImportModal({ onImport, onCancel }: ImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const workspace = useWorkspace()
  
  // Hook para manejar subidas directas de archivos con URLs firmadas
  const { uploadFile, isUploading: hookIsUploading } = useDirectFileUpload()
  
  // Sincronizar estado del hook con estado local
  useEffect(() => {
    setUploading(hookIsUploading)
  }, [hookIsUploading])
  const [processingOptions, setProcessingOptions] = useState({
    auto_categorize: true,
    detect_duplicates: true,
    validate_amounts: true,
    extract_merchant_info: true
  })
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    // Validar tipo de archivo
    const validExtensions = {
      'credit_card': ['.pdf', '.xlsx', '.xls', '.csv'],
      'bank_statement': ['.pdf', '.xlsx', '.xls', '.csv'],
      'receipt': ['.jpg', '.jpeg', '.png', '.pdf'],
      'other': ['.pdf', '.xlsx', '.xls', '.csv', '.txt']
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = fileType ? validExtensions[fileType as keyof typeof validExtensions] : []

    if (fileType && !allowedExtensions.includes(fileExtension)) {
      setErrors({ file: `Tipo de archivo no soportado para ${FILE_TYPES.find(t => t.value === fileType)?.label}` })
      return
    }

    // Validar tamaño (máximo 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setErrors({ file: 'El archivo es demasiado grande. Máximo 50MB permitido.' })
      return
    }

    setSelectedFile(file)
    setErrors({})
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedFile) {
      newErrors.file = 'Selecciona un archivo para importar'
    }

    if (!fileType) {
      newErrors.fileType = 'Selecciona el tipo de archivo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !selectedFile || !workspace.companyId) {
      return
    }

    try {
      // Generar ruta para el archivo
      const timestamp = new Date().toISOString().split('T')[0]
      const sanitizedFileType = fileType.replace(/[^a-z0-9]/gi, '-')
      const path = `${workspace.companyId}/imports/${sanitizedFileType}/${timestamp}/${selectedFile.name}`
      
      // Subir archivo usando subida directa con URL firmada
      const result = await uploadFile({
        bucket: 'finance-imports',
        path,
        file: selectedFile
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Error al subir el archivo')
      }
      
      // El archivo se subió exitosamente, ahora procesamos la importación
      onImport(selectedFile, fileType)
    } catch (error) {
      console.error('Error uploading file:', error)
      setErrors({ file: `Error al subir el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}` })
    }
  }

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FileSpreadsheet className="h-8 w-8 text-green-500" />
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Image className="h-8 w-8 text-blue-500" />
      default:
        return <FileText className="h-8 w-8 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Archivo Financiero
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de archivo */}
          <div className="space-y-3">
            <Label>Tipo de Archivo *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FILE_TYPES.map(type => (
                <Card 
                  key={type.value}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    fileType === type.value && 'ring-2 ring-blue-500 bg-blue-50'
                  )}
                  onClick={() => setFileType(type.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-medium">{type.label}</h4>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {type.supportedFormats.map(format => (
                            <Badge key={format} variant="outline" className="text-xs">
                              {format}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {errors.fileType && <p className="text-sm text-red-500">{errors.fileType}</p>}
          </div>

          {/* Área de subida de archivo */}
          <div className="space-y-3">
            <Label>Archivo *</Label>
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                dragOver && 'border-blue-500 bg-blue-50',
                !dragOver && 'border-gray-300 hover:border-gray-400'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    {getFileIcon(selectedFile)}
                    <div className="text-left">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Archivo seleccionado</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium">Arrastra tu archivo aquí</p>
                    <p className="text-gray-600">o</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Seleccionar archivo
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Tamaño máximo: 50MB
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.txt"
              onChange={handleFileInputChange}
            />
            {errors.file && <p className="text-sm text-red-500">{errors.file}</p>}
          </div>

          {/* Opciones de procesamiento */}
          <div className="space-y-4">
            <Label>Opciones de Procesamiento</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PROCESSING_FEATURES.map((feature, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {feature.icon}
                    <div>
                      <p className="font-medium text-sm">{feature.title}</p>
                      <p className="text-xs text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={processingOptions[Object.keys(processingOptions)[index] as keyof typeof processingOptions]}
                    onCheckedChange={(checked) => {
                      const key = Object.keys(processingOptions)[index] as keyof typeof processingOptions
                      setProcessingOptions(prev => ({
                        ...prev,
                        [key]: checked
                      }))
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notas adicionales */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Agregar notas sobre este archivo o procesamiento especial..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Información del procesamiento */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-blue-800">
                ¿Cómo funciona el procesamiento?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 text-xs font-bold">
                  1
                </div>
                <p className="text-sm text-blue-700">
                  <strong>Análisis del archivo:</strong> Extraemos texto y datos usando OCR e IA
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 text-xs font-bold">
                  2
                </div>
                <p className="text-sm text-blue-700">
                  <strong>Identificación de gastos:</strong> Detectamos fechas, montos y descripciones
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 text-xs font-bold">
                  3
                </div>
                <p className="text-sm text-blue-700">
                  <strong>Categorización automática:</strong> Asignamos categorías basadas en patrones
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 text-xs font-bold">
                  4
                </div>
                <p className="text-sm text-blue-700">
                  <strong>Revisión final:</strong> Podrás revisar y ajustar los gastos importados
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Errores generales */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-700">{errors.general}</p>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={uploading || !selectedFile || !fileType}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar y Procesar
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}