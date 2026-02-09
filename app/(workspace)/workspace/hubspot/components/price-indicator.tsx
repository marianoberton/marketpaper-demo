'use client'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getPriceClassificationStyles, type PriceClassification } from '@/lib/hubspot/price-analysis'
import { formatCurrencyPerM2 } from '@/lib/formatters'

interface PriceIndicatorProps {
  classification: PriceClassification
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function PriceIndicator({ 
  classification, 
  showDetails = false,
  size = 'md' 
}: PriceIndicatorProps) {
  const styles = getPriceClassificationStyles(classification)
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const indicator = (
    <Badge 
      variant="outline" 
      className={`${styles.bg} ${styles.text} ${styles.border} ${sizeClasses[size]} font-medium gap-1`}
    >
      <span>{classification.emoji}</span>
      <span>{classification.label}</span>
      {classification.percentDiff !== 0 && (
        <span className="text-xs opacity-75">
          ({classification.percentDiff > 0 ? '+' : ''}{classification.percentDiff}%)
        </span>
      )}
    </Badge>
  )

  if (!showDetails) {
    return indicator
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{classification.description}</p>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>Precio cotizado: {formatCurrencyPerM2(classification.quotedPrice)}</p>
              <p>Precio mercado: {formatCurrencyPerM2(classification.marketAvg)}</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface PriceStatsCardProps {
  stats: {
    total: number
    inRange: number
    belowMarket: number
    aboveMarket: number
    avgDiffPercent: number
  }
}

export function PriceStatsCard({ stats }: PriceStatsCardProps) {
  const inRangePercent = stats.total > 0 ? Math.round((stats.inRange / stats.total) * 100) : 0
  const belowPercent = stats.total > 0 ? Math.round((stats.belowMarket / stats.total) * 100) : 0
  const abovePercent = stats.total > 0 ? Math.round((stats.aboveMarket / stats.total) * 100) : 0

  return (
    <div className="flex flex-col gap-3">
      <h4 className="font-medium text-sm">Clasificación de Precios</h4>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
          <span className="text-2xl">🟢</span>
          <span className="text-lg font-bold text-green-700 dark:text-green-400">
            {stats.inRange}
          </span>
          <span className="text-xs text-green-600 dark:text-green-500">
            En precio ({inRangePercent}%)
          </span>
        </div>
        
        <div className="flex flex-col items-center p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
          <span className="text-2xl">🟡</span>
          <span className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
            {stats.belowMarket}
          </span>
          <span className="text-xs text-yellow-600 dark:text-yellow-500">
            Por debajo ({belowPercent}%)
          </span>
        </div>
        
        <div className="flex flex-col items-center p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
          <span className="text-2xl">🔴</span>
          <span className="text-lg font-bold text-red-700 dark:text-red-400">
            {stats.aboveMarket}
          </span>
          <span className="text-xs text-red-600 dark:text-red-500">
            Por encima ({abovePercent}%)
          </span>
        </div>
      </div>

      {/* Progress bar visualization */}
      <div className="h-2 rounded-full overflow-hidden flex bg-muted">
        <div 
          className="bg-green-500 h-full transition-all" 
          style={{ width: `${inRangePercent}%` }} 
        />
        <div 
          className="bg-yellow-500 h-full transition-all" 
          style={{ width: `${belowPercent}%` }} 
        />
        <div 
          className="bg-red-500 h-full transition-all" 
          style={{ width: `${abovePercent}%` }} 
        />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Diferencia promedio con mercado: {stats.avgDiffPercent > 0 ? '+' : ''}{stats.avgDiffPercent}%
      </p>
    </div>
  )
}
