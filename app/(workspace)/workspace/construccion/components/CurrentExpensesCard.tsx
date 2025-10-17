'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'
import { Project } from '@/lib/construction'

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

interface CurrentExpensesCardProps {
  project: Project
}

export default function CurrentExpensesCard({ project }: CurrentExpensesCardProps) {
  const [taxPayments, setTaxPayments] = useState<TaxPayment[]>([])
  const [loading, setLoading] = useState(true)

  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Cargar pagos de impuestos
  useEffect(() => {
    const fetchTaxPayments = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/workspace/construction/tax-payments?projectId=${project.id}`)
        
        if (!response.ok) {
          throw new Error('Error al cargar los pagos')
        }
        
        const data = await response.json()
        setTaxPayments(data.payments || [])
      } catch (err) {
        console.error('Error fetching tax payments:', err)
      } finally {
        setLoading(false)
      }
    }

    if (project.id) {
      fetchTaxPayments()
    }
  }, [project.id])

  // Calcular gastos actuales
  const totalGastosActuales = taxPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const cantidadPagos = taxPayments.length

  if (loading) {
    return (
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Información Económica
          </CardTitle>
          <p className="text-sm text-gray-600">
            Gestión financiera y control de costos del proyecto
          </p>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Información Económica
        </CardTitle>
        <p className="text-sm text-gray-600">
          Gestión financiera y control de costos del proyecto
        </p>
      </CardHeader>
      <CardContent>
        <div className="bg-white border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Gastos Actuales</span>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalGastosActuales)}
            </p>
            <p className="text-sm text-gray-500">
              {cantidadPagos} pago{cantidadPagos !== 1 ? 's' : ''} registrado{cantidadPagos !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}