'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText,
  Clock,
  Receipt,
  Trash2,
  Plus
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
  updated_at: string
  payment_receipts?: Array<{
    id: string
    file_url: string
    file_name: string
  }>
}

interface PaymentsListProps {
  taxPayments: TaxPayment[]
  formatCurrency: (amount: number) => string
  onNewPayment: () => void
  onViewReceipt: (receiptUrl: string) => void
  onDeletePayment: (paymentId: string) => void
  isDeletingPayment: string | null
  maxVisible?: number
}

export default function PaymentsList({
  taxPayments,
  formatCurrency,
  onNewPayment,
  onViewReceipt,
  onDeletePayment,
  isDeletingPayment,
  maxVisible = 5
}: PaymentsListProps) {
  const visiblePayments = taxPayments.slice(0, maxVisible)
  const hasMorePayments = taxPayments.length > maxVisible

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

  if (taxPayments.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pagos Registrados (0)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-center py-12 px-6">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pagos registrados</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Comienza registrando el primer pago para hacer seguimiento económico del proyecto
            </p>
            <Button 
              onClick={onNewPayment}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primer Pago
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Pagos Registrados ({taxPayments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {visiblePayments.map((payment) => (
            <div key={payment.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                {/* Información principal del pago */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge 
                      variant="outline" 
                      className={`font-medium ${getPaymentTypeBadgeClass(payment.payment_type)}`}
                    >
                      {getPaymentTypeLabel(payment.payment_type)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
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
                    <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                      {payment.description}
                    </p>
                  )}
                </div>
                
                {/* Monto y acciones */}
                <div className="flex items-center gap-4 ml-6">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment.payment_receipts && payment.payment_receipts.length > 0 ? 'Con comprobante' : 'Sin comprobante'}
                    </p>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex items-center gap-2">
                    {/* Botón de comprobante */}
                    {payment.payment_receipts && payment.payment_receipts.length > 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const receipt = payment.payment_receipts![0]
                          onViewReceipt(receipt.file_url)
                        }}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="text-gray-400 border-gray-200"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Sin archivo
                      </Button>
                    )}
                    
                    {/* Botón de eliminar */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeletePayment(payment.id)}
                      disabled={isDeletingPayment === payment.id}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    >
                      {isDeletingPayment === payment.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Mostrar más pagos */}
          {hasMorePayments && (
            <div className="p-6 bg-gray-50 border-t">
              <div className="text-center">
                <Button variant="outline" size="sm" className="text-gray-600">
                  Ver todos los pagos ({taxPayments.length - maxVisible} más)
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}