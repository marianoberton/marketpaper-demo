'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, FileText, X, AlertCircle, DollarSign, Calendar, Receipt } from 'lucide-react'
import { useDirectFileUpload } from '@/lib/hooks/useDirectFileUpload'
import { formatFileSize } from '@/lib/storage'

interface PaymentFormData {
  payment_type: 'honorarios_profesionales' | 'derecho_construccion' | 'plusvalia'
  rubro: string
  amount: number
  payment_date: string
  receipt_number: string
  description: string
  notes: string
}

interface PaymentFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (paymentData: PaymentFormData, receiptFile?: File) => Promise<void>
  projectId: string
  isSubmitting?: boolean
}

const PAYMENT_TYPES = [
  { value: 'honorarios_profesionales', label: 'Encomiendas Profesionales' },
  { value: 'derecho_construccion', label: 'Derecho de Construcción' },
  { value: 'plusvalia', label: 'Plusvalía' }
]

export default function PaymentFormModal({
  isOpen,
  onClose,
  onSubmit,
  projectId,
  isSubmitting = false
}: PaymentFormModalProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
    payment_type: 'honorarios_profesionales',
    rubro: '',
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    receipt_number: '',
    description: '',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string>('')
  
  const { uploadFile, isUploading, progress } = useDirectFileUpload()

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        payment_type: 'honorarios_profesionales',
        rubro: '',
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        receipt_number: '',
        description: '',
        notes: ''
      })
      setErrors({})
      setSelectedFile(null)
      setFilePreview('')
    }
  }, [isOpen])

  const handleInputChange = (field: keyof PaymentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, file: 'Solo se permiten archivos PDF, JPG, JPEG o PNG' }))
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, file: 'El archivo no puede ser mayor a 10MB' }))
      return
    }

    setSelectedFile(file)
    setFilePreview(file.name)
    setErrors(prev => ({ ...prev, file: '' }))
  }

  const removeFile = () => {
    setSelectedFile(null)
    setFilePreview('')
    setErrors(prev => ({ ...prev, file: '' }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.payment_type) {
      newErrors.payment_type = 'Selecciona el tipo de pago'
    }

    if (!formData.rubro.trim()) {
      newErrors.rubro = 'El rubro es requerido'
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0'
    }

    if (!formData.payment_date) {
      newErrors.payment_date = 'La fecha de pago es requerida'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData, selectedFile || undefined)
    } catch (error) {
      console.error('Error submitting payment:', error)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Registrar Nuevo Pago
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Pago */}
          <div className="space-y-2">
            <Label htmlFor="payment_type">Tipo de Pago *</Label>
            <Select
              value={formData.payment_type}
              onValueChange={(value) => handleInputChange('payment_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de pago" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.payment_type && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.payment_type}
              </p>
            )}
          </div>

          {/* Rubro */}
          <div className="space-y-2">
            <Label htmlFor="rubro">Rubro *</Label>
            <Input
              id="rubro"
              value={formData.rubro}
              onChange={(e) => handleInputChange('rubro', e.target.value)}
              placeholder="Ej: Arquitecto, Ingeniero, Tasas municipales..."
            />
            {errors.rubro && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.rubro}
              </p>
            )}
          </div>

          {/* Monto y Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <Input
                id="amount"
                type="text"
                value={formData.amount || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.,]/g, '')
                  const numericValue = parseFloat(value.replace(',', '.')) || 0
                  handleInputChange('amount', numericValue)
                }}
                placeholder="0.00"
              />
              {formData.amount > 0 && (
                <p className="text-sm text-gray-600">
                  {formatCurrency(formData.amount)}
                </p>
              )}
              {errors.amount && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.amount}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_date">Fecha de Pago *</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => handleInputChange('payment_date', e.target.value)}
              />
              {errors.payment_date && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.payment_date}
                </p>
              )}
            </div>
          </div>

          {/* Número de Comprobante */}
          <div className="space-y-2">
            <Label htmlFor="receipt_number">Número de Comprobante</Label>
            <Input
              id="receipt_number"
              value={formData.receipt_number}
              onChange={(e) => handleInputChange('receipt_number', e.target.value)}
              placeholder="Ej: 001-00001234, FC-A-0001..."
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe el concepto del pago..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Notas adicionales */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionales</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Información adicional (opcional)..."
              rows={2}
            />
          </div>

          {/* Upload de Comprobante */}
          <div className="space-y-2">
            <Label>Comprobante (Opcional)</Label>
            <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
              <CardContent className="p-6">
                {!selectedFile ? (
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Arrastra un archivo aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      PDF, JPG, JPEG, PNG (máx. 10MB)
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Seleccionar Archivo
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {isUploading && (
                  <div className="mt-4">
                    <Progress value={progress} className="w-full" />
                    <p className="text-xs text-gray-500 mt-1">
                      Subiendo archivo... {Math.round(progress)}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            {errors.file && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.file}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || isUploading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? 'Guardando...' : 'Registrar Pago'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}