'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

export interface KPICardData {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  borderColor: string
}

interface KPICardsProps {
  cards: KPICardData[]
  columns?: 3 | 4
}

export function KPICards({ cards, columns = 4 }: KPICardsProps) {
  return (
    <div className={cn(
      'grid gap-4',
      columns === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'
    )}>
      {cards.map((card) => (
        <KPICard key={card.title} {...card} />
      ))}
    </div>
  )
}

function KPICard({ title, value, subtitle, icon: Icon, borderColor }: KPICardData) {
  return (
    <Card className={cn('border-l-4 shadow-sm', borderColor)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}
