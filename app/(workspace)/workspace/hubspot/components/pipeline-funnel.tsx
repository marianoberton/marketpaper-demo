'use client'

import { formatCurrency, formatM2 } from '@/lib/formatters'
import type { StageMetric } from '@/actions/hubspot-analytics'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface PipelineFunnelProps {
  stages: StageMetric[]
  totalDeals: number
}

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  'contacto inicial': { bg: 'bg-blue-500', text: 'text-white' },
  'envío de presupuesto': { bg: 'bg-cyan-500', text: 'text-white' },
  'envio de presupuesto': { bg: 'bg-cyan-500', text: 'text-white' },
  'seguimiento/negociación - 14': { bg: 'bg-amber-500', text: 'text-white' },
  'seguimiento/negociacion - 14': { bg: 'bg-amber-500', text: 'text-white' },
  'seguimiento/negociación -14': { bg: 'bg-amber-500', text: 'text-white' },
  'seguimiento/negociacion -14': { bg: 'bg-amber-500', text: 'text-white' },
  'seguimiento/negociación +14': { bg: 'bg-orange-500', text: 'text-white' },
  'seguimiento/negociacion +14': { bg: 'bg-orange-500', text: 'text-white' },
  'seguimiento/negociación + 14': { bg: 'bg-orange-500', text: 'text-white' },
  'seguimiento/negociacion + 14': { bg: 'bg-orange-500', text: 'text-white' },
  'confirmado/orden recibida': { bg: 'bg-emerald-600', text: 'text-white' },
  'cierre ganado': { bg: 'bg-green-600', text: 'text-white' },
  'cierre perdido': { bg: 'bg-red-600', text: 'text-white' },
}

function getStageColors(label: string): { bg: string; text: string } {
  const normalized = label.toLowerCase().trim()
  return STAGE_COLORS[normalized] || { bg: 'bg-slate-500', text: 'text-white' }
}

export function PipelineFunnel({ stages, totalDeals }: PipelineFunnelProps) {
  // Filter out stages with 0 deals for cleaner visualization
  const activeStages = stages.filter(s => s.dealCount > 0)

  if (activeStages.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No hay deals en el pipeline
      </div>
    )
  }

  // Calculate the maximum width percentage based on the first stage
  const maxDeals = Math.max(...activeStages.map(s => s.dealCount))

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-1 py-4">
        {activeStages.map((stage, index) => {
          const widthPercent = maxDeals > 0 ? (stage.dealCount / maxDeals) * 100 : 0
          const colors = getStageColors(stage.stageLabel)
          const percentOfTotal = totalDeals > 0 ? Math.round((stage.dealCount / totalDeals) * 100) : 0

          return (
            <Tooltip key={stage.stageId}>
              <TooltipTrigger asChild>
                <div className="relative flex justify-center">
                  <div
                    className={`
                      ${colors.bg} ${colors.text}
                      relative flex items-center justify-center
                      py-3 px-4 min-h-[48px]
                      transition-all duration-300 hover:opacity-90
                      cursor-pointer
                    `}
                    style={{
                      width: `${Math.max(widthPercent, 20)}%`,
                      clipPath: index === activeStages.length - 1
                        ? 'polygon(5% 0, 95% 0, 100% 100%, 0% 100%)'
                        : 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)',
                    }}
                  >
                    <div className="flex flex-col items-center text-center z-10">
                      <span className="text-xs font-medium opacity-90 line-clamp-1">
                        {stage.stageLabel}
                      </span>
                      <span className="text-sm font-bold">
                        {stage.dealCount} deals
                      </span>
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">{stage.stageLabel}</p>
                  <div className="text-xs space-y-0.5">
                    <p>Deals: <span className="font-medium">{stage.dealCount}</span> ({percentOfTotal}% del total)</p>
                    <p>Monto: <span className="font-medium">{formatCurrency(stage.totalAmount)}</span></p>
                    <p>m2: <span className="font-medium">{formatM2(stage.totalM2)}</span></p>
                    {stage.avgPricePerM2 > 0 && (
                      <p>Promedio $/m2: <span className="font-medium">{formatCurrency(stage.avgPricePerM2)}</span></p>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
