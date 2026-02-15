'use client'

import { Card, CardContent } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'

interface EconomicSummaryCardProps {
  title: string
  amount: number
  description: string
  icon?: React.ReactNode
  borderColor?: string
  iconBgColor?: string
  iconColor?: string
  formatCurrency: (amount: number) => string
}

export default function EconomicSummaryCard({
  title,
  amount,
  description,
  icon = <DollarSign className="h-8 w-8" />,
  borderColor = 'border-l-primary',
  iconBgColor = 'bg-primary/10',
  iconColor = 'text-primary',
  formatCurrency
}: EconomicSummaryCardProps) {
  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground mb-2">
              {formatCurrency(amount)}
            </p>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>
          <div className={`p-3 ${iconBgColor} rounded-full`}>
            <div className={iconColor}>
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
