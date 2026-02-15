'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  Receipt,
  TrendingUp,
  Clock,
  AlertCircle,
  FileText,
  X
} from 'lucide-react'

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
  payment_receipts?: Array<{
    id: string
    file_url: string
    file_name: string
  }>
}

interface ProjectEconomicInfoProps {
  projectId: string
}

const getPaymentTypeLabel = (type: string) => {
  switch (type) {
    case 'professional_commission':
      return 'Encomienda Profesional'
    case 'construction_rights':
      return 'Derecho de Construcción'
    case 'surplus_value':
      return 'Plusvalía'
    default:
      return type
  }
}

const getPaymentTypeBadgeClass = (type: string) => {
  switch (type) {
    case 'professional_commission':
      return 'border-blue-200 bg-blue-50 text-blue-700'
    case 'construction_rights':
      return 'border-green-200 bg-green-50 text-green-700'
    case 'surplus_value':
      return 'border-purple-200 bg-purple-50 text-purple-700'
    default:
      return 'border-gray-200 bg-gray-50 text-gray-700'
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Componente para mostrar recibos
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
        <div className="p-6 pb-4 border-b border-gray-200 bg-[#1B293F] text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Comprobante de Pago</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="bg-white/10 text-white border-white/30 hover:bg-white/20"
              >
                <FileText className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenExternal}
                className="bg-white/10 text-white border-white/30 hover:bg-white/20"
              >
                <FileText className="h-4 w-4 mr-2" />
                Abrir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="bg-white/10 text-white border-white/30 hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <Clock className="h-8 w-8 animate-spin text-[#1B293F] mr-2" />
              <span className="text-gray-600">Cargando vista previa...</span>
            </div>
          )}

          {isPDF && (
            <iframe
              src={`${receiptUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-[600px] border border-gray-200 rounded-lg"
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
                <Button
                  onClick={handleDownload}
                  className="bg-[#1B293F] text-white hover:bg-[#1B293F]/90"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Descargar archivo
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOpenExternal}
                  className="border-[#1B293F] text-[#1B293F] hover:bg-gray-50"
                >
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

export default function ProjectEconomicInfo({ projectId }: ProjectEconomicInfoProps) {
  const [payments, setPayments] = useState<TaxPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/workspace/construction/tax-payments?projectId=${projectId}`)
        
        if (!response.ok) {
          throw new Error('Error al cargar los pagos')
        }
        
        const data = await response.json()
        setPayments(data.payments || [])
      } catch (err) {
        console.error('Error fetching payments:', err)
        setError('Error al cargar la información económica')
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchPayments()
    }
  }, [projectId])

  const calculateTotalByCategory = () => {
    const totals = {
      professional_commission: 0,
      construction_rights: 0,
      surplus_value: 0
    }

    payments.forEach(payment => {
      if (payment.payment_type in totals) {
        totals[payment.payment_type as keyof typeof totals] += payment.amount
      }
    })

    return totals
  }

  const calculateCategoryPercentages = () => {
    const totals = calculateTotalByCategory()
    const total = totalAmount
    
    if (total === 0) return {}
    
    return {
      professional_commission: (totals.professional_commission / total) * 100,
      construction_rights: (totals.construction_rights / total) * 100,
      surplus_value: (totals.surplus_value / total) * 100
    }
  }

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const categoryTotals = calculateTotalByCategory()
  const categoryPercentages = calculateCategoryPercentages()

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-white overflow-hidden">
        <div className="bg-[#1B293F] text-white py-4 sm:py-6 px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
            <h2 className="text-lg sm:text-xl font-semibold">Información Económica</h2>
          </div>
        </div>
        <div className="p-8">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Cargando información económica...</p>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-lg border-0 bg-white overflow-hidden">
        <div className="bg-[#1B293F] text-white py-4 sm:py-6 px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
            <h2 className="text-lg sm:text-xl font-semibold">Información Económica</h2>
          </div>
        </div>
        <div className="p-4 sm:p-8">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-white overflow-hidden h-full flex flex-col">
      <div className="bg-[#1B293F] text-white py-4 sm:py-6 px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
          <h2 className="text-lg sm:text-xl font-semibold">Información Económica</h2>
        </div>
      </div>
      <div className="p-4 sm:p-8 flex-1">
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">No hay pagos registrados</p>
            <p className="text-sm text-gray-500">Aún no se han registrado pagos para este proyecto</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumen total */}
            <div className="bg-blue-50 rounded-lg p-4 sm:p-6 border border-blue-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-blue-900">Total de Pagos</h3>
                  <p className="text-xs sm:text-sm text-blue-700">{payments.length} pagos registrados</p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xl sm:text-2xl font-bold text-blue-900">{formatCurrency(totalAmount)}</div>
                </div>
              </div>
            </div>

            {/* Distribución por categorías */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Distribución por Categorías</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: 'professional_commission', label: 'Encomiendas Profesionales' },
                  { key: 'construction_rights', label: 'Derechos de Construcción' },
                  { key: 'surplus_value', label: 'Plusvalía' }
                ].map(({ key, label }) => {
                  const amount = categoryTotals[key as keyof typeof categoryTotals]
                  
                  return (
                    <div key={key} className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 text-center flex flex-col justify-between min-h-[100px]">
                      <div className="text-xs sm:text-sm font-medium text-gray-600 mb-2 min-h-[2.5rem] flex items-center justify-center">
                        <span className="text-center leading-tight">{label}</span>
                      </div>
                      <div className="text-base sm:text-lg font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                        {formatCurrency(amount)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Listado de pagos individuales */}
        {payments.length > 0 && (
          <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[#1B293F]" />
              Detalle de Pagos
            </h4>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Payment info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={getPaymentTypeBadgeClass(payment.payment_type)}
                        >
                          {getPaymentTypeLabel(payment.payment_type)}
                        </Badge>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-600 mb-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(payment.payment_date).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                        {payment.receipt_number && (
                          <div className="flex items-center gap-1">
                            <Receipt className="h-3 w-3" />
                            Comprobante #{payment.receipt_number}
                          </div>
                        )}
                      </div>

                      {payment.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {payment.description}
                        </p>
                      )}
                    </div>

                    {/* Amount and action */}
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                      </div>

                      {/* View receipt button */}
                      {payment.payment_receipts && payment.payment_receipts.length > 0 ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            const receipt = payment.payment_receipts![0]
                            setSelectedReceiptUrl(receipt.file_url)
                          }}
                          className="bg-[#1B293F] text-white hover:bg-[#1B293F]/90 whitespace-nowrap"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Ver comprobante
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled
                          variant="outline"
                          className="text-gray-400 border-gray-200 whitespace-nowrap"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Sin comprobante
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Receipt preview modal */}
      <ReceiptViewModal
        isOpen={selectedReceiptUrl !== null}
        onClose={() => setSelectedReceiptUrl(null)}
        receiptUrl={selectedReceiptUrl || ''}
      />
    </Card>
  )
}