'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Receipt } from "lucide-react"

interface CategoryItem {
  category: string
  amount: number
  percentage: number
  color: string
}

interface CategoryDistributionProps {
  costBreakdown: CategoryItem[]
  totalGastos: number
  formatCurrency: (amount: number) => string
}

export default function CategoryDistribution({
  costBreakdown,
  totalGastos,
  formatCurrency
}: CategoryDistributionProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Receipt className="h-6 w-6 text-purple-600" />
          Distribución por Categorías
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {costBreakdown.length > 0 ? (
          <div className="space-y-4">
            {costBreakdown.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${item.color}`}></div>
                    <span className="font-medium">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.amount)}</p>
                    <p className="text-sm text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                  </div>
                </div>
                {/* Barra de progreso visual */}
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}

            {/* Resumen total */}
            <Separator className="my-4" />
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <span className="font-semibold text-foreground">Total Pagado</span>
              <span className="font-bold text-foreground">{formatCurrency(totalGastos)}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">No hay pagos registrados</p>
            <p className="text-sm text-muted-foreground">Comienza registrando el primer pago del proyecto</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
