'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  Receipt, 
  TrendingUp,
  Clock,
  AlertCircle
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

export default function ProjectEconomicInfo({ projectId }: ProjectEconomicInfoProps) {
  const [payments, setPayments] = useState<TaxPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
                    <div key={key} className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 text-center">
                      <div className="text-xs sm:text-sm font-medium text-gray-600 mb-2">
                        {label}
                      </div>
                      <div className="text-base sm:text-lg font-bold text-gray-900">
                        {formatCurrency(amount)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}