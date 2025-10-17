'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Clock } from "lucide-react"

interface TaxPayment {
  id: string
  payment_date: string
  amount: number
}

interface TemporalAnalysisProps {
  taxPayments: TaxPayment[]
  totalGastos: number
  formatCurrency: (amount: number) => string
}

export default function TemporalAnalysis({ 
  taxPayments, 
  totalGastos, 
  formatCurrency 
}: TemporalAnalysisProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <BarChart3 className="h-6 w-6 text-green-600" />
          Análisis Temporal de Gastos
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {taxPayments.length > 0 ? (
          <div className="space-y-6">
            {/* Gráfico temporal simplificado */}
            {(() => {
              const monthlyData = taxPayments.reduce((acc, payment) => {
                const month = new Date(payment.payment_date).toLocaleDateString('es-AR', { 
                  month: 'short', 
                  year: '2-digit' 
                })
                acc[month] = (acc[month] || 0) + payment.amount
                return acc
              }, {} as Record<string, number>)

              const maxAmount = Math.max(...Object.values(monthlyData))

              return Object.entries(monthlyData).map(([month, amount]) => (
                <div key={month} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{month}</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
                      style={{ width: `${(amount / maxAmount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            })()}

            {/* Estadísticas mejoradas */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600 mr-1" />
                    <p className="text-sm text-green-700 font-medium">Promedio Mensual</p>
                  </div>
                  <p className="text-xl font-bold text-green-800">
                    {formatCurrency(taxPayments.length > 0 ? totalGastos / Math.max(1, new Set(taxPayments.map(p => new Date(p.payment_date).getMonth())).size) : 0)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-5 w-5 text-orange-600 mr-1" />
                    <p className="text-sm text-orange-700 font-medium">Último Pago</p>
                  </div>
                  <p className="text-xl font-bold text-orange-800">
                    {taxPayments.length > 0 ? new Date(Math.max(...taxPayments.map(p => new Date(p.payment_date).getTime()))).toLocaleDateString('es-AR') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">Sin datos temporales</p>
            <p className="text-sm text-gray-500">Los gráficos aparecerán cuando registres pagos</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}