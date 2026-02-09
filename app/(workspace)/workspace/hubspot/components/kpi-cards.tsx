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
      'grid gap-3 sm:gap-4',
      columns === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
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
      <CardHeader className="pb-2 p-4 sm:p-6">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-2">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="text-xl sm:text-2xl font-bold break-words">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}
