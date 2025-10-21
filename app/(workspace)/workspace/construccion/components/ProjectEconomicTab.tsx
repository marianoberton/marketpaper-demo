'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  PieChart, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Save,
  X,
  Plus,
  FileText,
  Receipt,
  Trash2
} from 'lucide-react'
import PaymentFormModal from './PaymentFormModal'
import { Project } from '@/lib/construction'
import { formatCurrency } from '@/lib/formatters'
import { createClient } from '@supabase/supabase-js'
import { useWorkspace } from '@/components/workspace-context'
import EconomicSummaryCard from './EconomicSummaryCard'
import PaymentsList from './PaymentsList'
import CategoryDistribution from './CategoryDistribution'
import TemporalAnalysis from './TemporalAnalysis'

// Componente simple para mostrar recibos
const ReceiptViewModal = ({ isOpen, onClose, receiptUrl }: { isOpen: boolean, onClose: () => void, receiptUrl: string }) => {
  const [isLoading, setIsLoading] = useState(true)
  
  if (!isOpen) return null
  
  const isPDF = receiptUrl.toLowerCase().includes('.pdf') || receiptUrl.includes('application/pdf')
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(receiptUrl)
  
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = receiptUrl
    link.download = 'comprobante.pdf'
    link.click()
  }

  const handleOpenExternal = () => {
    window.open(receiptUrl, '_blank')
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-0 max-w-[95vw] w-[95vw] max-h-[90vh] overflow-hidden">
        <div className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Comprobante de Pago</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <FileText className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenExternal}>
                <FileText className="h-4 w-4 mr-2" />
                Abrir
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <Clock className="h-8 w-8 animate-spin text-blue-600 mr-2" />
              <span className="text-gray-600">Cargando vista previa...</span>
            </div>
          )}

          {isPDF && (
            <iframe
              src={`${receiptUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-[600px] border rounded-lg"
              onLoad={() => setIsLoading(false)}
              style={{ display: isLoading ? 'none' : 'block' }}
              title="Comprobante de pago"
            />
          )}

          {isImage && (
            <div className="flex justify-center">
              <img
                src={receiptUrl}
                alt="Comprobante de pago"
                className="max-w-full max-h-[600px] object-contain rounded-lg shadow-lg"
                onLoad={() => setIsLoading(false)}
                style={{ display: isLoading ? 'none' : 'block' }}
              />
            </div>
          )}

          {!isPDF && !isImage && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Vista previa no disponible
              </h3>
              <p className="text-gray-600 mb-4">
                Este tipo de archivo no se puede previsualizar en el navegador.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleDownload} className="bg-blue-500 hover:bg-blue-600">
                  <FileText className="h-4 w-4 mr-2" />
                  Descargar archivo
                </Button>
                <Button variant="outline" onClick={handleOpenExternal}>
                  <FileText className="h-4 w-4 mr-2" />
                  Abrir en nueva ventana
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ProjectEconomicTabProps {
  project: Project
  isEditing?: boolean
  editedProject?: Project
  setEditedProject?: (project: Project) => void
}

interface TaxPayment {
  id: string
  payment_type: 'professional_commission' | 'construction_rights' | 'surplus_value'
  rubro: 'A' | 'B' | 'C'
  amount: number
  payment_date: string
  receipt_number?: string
  description?: string
  notes?: string
  created_at: string
  updated_at: string
}

interface PaymentReceipt {
  id: string
  tax_payment_id: string
  file_name: string
  file_url: string
  file_type: string
  receipt_type: string
  receipt_number?: string
  receipt_date?: string
  vendor_name?: string
  description?: string
  created_at: string
}

interface EconomicData {
  presupuestoInicial: number
  gastosActuales: number
  gastosProyectados: number
  honorariosProfesionales: number
  costosGestoria: number
  impuestosYTasas: number
  seguros: number
  materialesYManoObra: number
  contingencias: number
}

export default function ProjectEconomicTab({ 
  project, 
  isEditing = false, 
  editedProject, 
  setEditedProject 
}: ProjectEconomicTabProps) {
  const workspace = useWorkspace()
  const [taxPayments, setTaxPayments] = useState<TaxPayment[]>([])
  const [paymentReceipts, setPaymentReceipts] = useState<PaymentReceipt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const [isDeletingPayment, setIsDeletingPayment] = useState<string | null>(null)
  const [editingEconomic, setEditingEconomic] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)

  // Fetch tax payments
  useEffect(() => {
    const fetchTaxPayments = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/workspace/construction/tax-payments?projectId=${project.id}`, {
          credentials: 'include', // Incluir cookies de sesión
        })
        
        if (!response.ok) {
          throw new Error('Error al cargar los pagos')
        }
        
        const data = await response.json()
        setTaxPayments(data.payments || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    if (project.id) {
      fetchTaxPayments()
    }
  }, [project.id])

  const handlePaymentSubmit = async (paymentData: any, receiptFile?: File) => {
    setIsSubmittingPayment(true)
    try {
      // Map payment data to API format
      const categoryMapping: Record<string, string> = {
        'honorarios_profesionales': 'professional_fees',
        'derecho_construccion': 'construction_rights',
        'plusvalia': 'surplus_value'
      }

      const apiPayload = {
        projectId: project.id,
        category: categoryMapping[paymentData.payment_type] || paymentData.payment_type,
        subcategory: paymentData.rubro,
        amount: paymentData.amount,
        description: paymentData.description,
        paymentDate: paymentData.payment_date,
        receiptNumber: paymentData.receipt_number,
        notes: paymentData.notes
      }

      // Create payment
      const paymentResponse = await fetch('/api/workspace/construction/tax-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Incluir cookies de sesión
        body: JSON.stringify(apiPayload)
      })

      if (!paymentResponse.ok) {
        throw new Error('Error al crear el pago')
      }

      const newPayment = await paymentResponse.json()
      console.log('Debug - newPayment response:', newPayment)

      // Upload receipt if provided using correct flow
      if (receiptFile) {
        // Generate unique file path
        const fileExtension = receiptFile.name.split('.').pop()
        const timestamp = Date.now()
        const fileName = `receipt-${newPayment.payment.id}-${timestamp}.${fileExtension}`  // Corregido
        const filePath = `tax-payments/${project.id}/${fileName}`

        // Step 1: Get signed URL
        const signedUrlResponse = await fetch('/api/storage/create-upload-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Incluir cookies de sesión
          body: JSON.stringify({
            bucket: 'construction-documents',
            path: filePath,
            fileSize: receiptFile.size,
            mimeType: receiptFile.type
          })
        })

        if (!signedUrlResponse.ok) {
          const errorData = await signedUrlResponse.json()
          throw new Error(errorData.error || 'Error obteniendo URL firmada')
        }

        const { signedUrl, token } = await signedUrlResponse.json()

        // Step 2: Upload file directly to Supabase Storage
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { error: uploadError } = await supabase.storage
          .from('construction-documents')
          .uploadToSignedUrl(filePath, token, receiptFile)

        if (uploadError) {
          throw new Error(`Error subiendo archivo: ${uploadError.message}`)
        }

        // Step 3: Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('construction-documents')
          .getPublicUrl(filePath)

        // Step 4: Create receipt record with metadata
        console.log('Debug - Datos para payment-receipts:', {
          tax_payment_id: newPayment.payment.id,  // Corregido: acceder a newPayment.payment.id
          project_id: project.id,
          file_name: receiptFile.name,
          file_url: publicUrl,
          receipt_type: 'comprobante_pago'
        })

        const receiptResponse = await fetch('/api/workspace/construction/payment-receipts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Incluir cookies de sesión
          body: JSON.stringify({
            tax_payment_id: newPayment.payment.id,  // Corregido: acceder a newPayment.payment.id
            project_id: project.id,
            file_name: receiptFile.name,
            file_url: publicUrl,
            receipt_type: 'comprobante_pago'  // Cambiado de 'payment_receipt' a 'comprobante_pago'
          })
        })

        console.log('Debug - Response status:', receiptResponse.status)
        
        if (!receiptResponse.ok) {
          const errorData = await receiptResponse.json()
          console.log('Debug - Error data:', errorData)
          throw new Error(errorData.error || 'Error al crear el registro del comprobante')
        }
      }

      // Reload payments
      const response = await fetch(`/api/workspace/construction/tax-payments?projectId=${project.id}`)
      const data = await response.json()
      setTaxPayments(data.payments || [])
      setShowPaymentModal(false)
    } catch (error) {
      console.error('Error submitting payment:', error)
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  // Función para ver recibos
  const handleViewReceipt = (receiptUrl: string) => {
    setSelectedReceipt(receiptUrl)
  }

  // Función para eliminar pagos
  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este pago? Esta acción no se puede deshacer.')) {
      return
    }

    setIsDeletingPayment(paymentId)
    try {
      const response = await fetch(`/api/workspace/construction/tax-payments/${paymentId}`, {
        method: 'DELETE',
        credentials: 'include', // Incluir cookies de sesión
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar el pago')
      }

      // Recargar la lista de pagos
      const paymentsResponse = await fetch(`/api/workspace/construction/tax-payments?projectId=${project.id}`, {
        credentials: 'include', // Incluir cookies de sesión
      })
      const data = await paymentsResponse.json()
      setTaxPayments(data.payments || [])
    } catch (error) {
      console.error('Error deleting payment:', error)
      alert('Error al eliminar el pago. Por favor, inténtalo de nuevo.')
    } finally {
      setIsDeletingPayment(null)
    }
  }

  const calculateEconomicData = () => {
    const totalPagado = taxPayments.reduce((sum, payment) => sum + payment.amount, 0)
    
    const honorariosProfesionales = taxPayments
      .filter(p => p.payment_type === 'professional_commission')
      .reduce((sum, p) => sum + p.amount, 0)
    
    const derechoConstruccion = taxPayments
      .filter(p => p.payment_type === 'construction_rights')
      .reduce((sum, p) => sum + p.amount, 0)
    
    const plusvalia = taxPayments
      .filter(p => p.payment_type === 'surplus_value')
      .reduce((sum, p) => sum + p.amount, 0)

    return {
      presupuestoInicial: project.projected_total_cost || 0,
      gastosActuales: totalPagado,
      gastosProyectados: project.projected_total_cost || 0,
      honorariosProfesionales,
      derechoConstruccion,
      plusvalia,
      totalPagado
    }
  }

  const economicData = calculateEconomicData()
  const totalGastos = economicData.gastosActuales
  const presupuestoRestante = economicData.presupuestoInicial - totalGastos
  const porcentajeEjecutado = economicData.presupuestoInicial > 0 
    ? (totalGastos / economicData.presupuestoInicial) * 100 
    : 0
  const variacionPresupuesto = economicData.gastosProyectados - economicData.presupuestoInicial
  const porcentajeVariacion = economicData.presupuestoInicial > 0 
    ? (variacionPresupuesto / economicData.presupuestoInicial) * 100 
    : 0

  // Desglose de costos basado en datos reales
  const costBreakdown = [
    { 
      category: 'Encomiendas Profesionales', 
      amount: economicData.honorariosProfesionales, 
      percentage: economicData.presupuestoInicial > 0 
        ? (economicData.honorariosProfesionales / economicData.presupuestoInicial) * 100 
        : 0, 
      color: 'bg-blue-500' 
    },
    { 
      category: 'Derecho de Construcción', 
      amount: economicData.derechoConstruccion, 
      percentage: economicData.presupuestoInicial > 0 
        ? (economicData.derechoConstruccion / economicData.presupuestoInicial) * 100 
        : 0, 
      color: 'bg-green-500' 
    },
    { 
      category: 'Plusvalía', 
      amount: economicData.plusvalia, 
      percentage: economicData.presupuestoInicial > 0 
        ? (economicData.plusvalia / economicData.presupuestoInicial) * 100 
        : 0, 
      color: 'bg-yellow-500' 
    }
  ].filter(item => item.amount > 0) // Solo mostrar categorías con pagos

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Cargando información económica...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Información Económica</h2>
            <p className="text-gray-600">Gestión financiera y control de costos del proyecto</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowPaymentModal(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Pago
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </div>
        </div>
        
        <PaymentFormModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSubmit={handlePaymentSubmit}
          projectId={project.id}
          isSubmitting={isSubmittingPayment}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      {/* Header con resumen económico */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Información Económica</h2>
            <p className="text-gray-600 text-lg">Gestión financiera y control de costos del proyecto</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowPaymentModal(true)}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Pago
            </Button>
          </div>
        </div>

        {/* Información económica */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Solo mostramos la tarjeta de gastos actuales */}
          <EconomicSummaryCard
            title="Gastos Actuales"
            amount={totalGastos}
            description={`${taxPayments.length} pagos registrados`}
            icon={<DollarSign className="h-8 w-8" />}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-50"
            borderColor="border-blue-200"
            formatCurrency={formatCurrency}
          />
        </div>
      </div>

      {/* Análisis y distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <CategoryDistribution
          costBreakdown={costBreakdown}
          totalGastos={totalGastos}
          formatCurrency={formatCurrency}
        />

        <TemporalAnalysis
          taxPayments={taxPayments}
          totalGastos={totalGastos}
          formatCurrency={formatCurrency}
        />
      </div>

      {/* Lista de pagos */}
      <PaymentsList
        taxPayments={taxPayments}
        formatCurrency={formatCurrency}
        onNewPayment={() => setShowPaymentModal(true)}
        onViewReceipt={handleViewReceipt}
        onDeletePayment={handleDeletePayment}
        isDeletingPayment={isDeletingPayment}
      />

      {/* Modal de formulario de pago */}
      <PaymentFormModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSubmit={handlePaymentSubmit}
        projectId={project.id}
        isSubmitting={isSubmittingPayment}
      />

      {/* Modal de vista de recibo */}
      {selectedReceipt && (
        <ReceiptViewModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          receiptUrl={selectedReceipt}
        />
      )}
    </div>
  )
}