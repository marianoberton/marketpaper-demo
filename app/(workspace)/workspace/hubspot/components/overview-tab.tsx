'use client'

import { useEffect, useState, useCallback } from 'react'
import { getFullPipelineMetrics, type FullPipelineMetrics } from '@/actions/hubspot-analytics'
import { KPICards, type KPICardData } from './kpi-cards'
import { PipelineFunnel } from './pipeline-funnel'
import { MetricsChart } from '@/components/ui/metrics-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatM2, formatCurrencyPerM2, formatPercent } from '@/lib/formatters'
import {
  Target, Trophy, DollarSign, Briefcase,
  Ruler, Award, TrendingDown, BarChart3
} from 'lucide-react'
import { Loader2 } from 'lucide-react'

interface OverviewTabProps {
  companyId: string
  pipelineId: string
  refreshKey: number
  dateRange?: { from?: string; to?: string }
}

export function OverviewTab({ companyId, pipelineId, refreshKey, dateRange }: OverviewTabProps) {
  const [metrics, setMetrics] = useState<FullPipelineMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    if (!companyId || !pipelineId) return
    try {
      setLoading(true)
      setError(null)
      const data = await getFullPipelineMetrics(companyId, pipelineId, dateRange)
      setMetrics(data)
    } catch (err: any) {
      console.error('Error fetching pipeline metrics', err)
      setError(err.message || 'Error al cargar metricas')
    } finally {
      setLoading(false)
    }
  }, [companyId, pipelineId, dateRange])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics, refreshKey])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Cargando metricas del pipeline...</p>
        </div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <p>{error || 'No se pudieron cargar las metricas'}</p>
      </div>
    )
  }

  // KPI Cards Row 1 - Financial
  const financialKPIs: KPICardData[] = [
    {
      title: 'Pipeline Activo',
      value: formatCurrency(metrics.totalPipelineAmount),
      subtitle: `${metrics.openDeals} negocios abiertos`,
      icon: Target,
      borderColor: 'border-l-blue-500',
    },
    {
      title: 'Ganado (Historico)',
      value: formatCurrency(metrics.wonAmount),
      subtitle: `${metrics.wonDeals} cerrados ganados`,
      icon: Trophy,
      borderColor: 'border-l-green-500',
    },
    {
      title: 'Ticket Promedio',
      value: formatCurrency(metrics.avgTicketWon),
      subtitle: 'En negocios ganados',
      icon: DollarSign,
      borderColor: 'border-l-purple-500',
    },
    {
      title: 'Win Rate',
      value: formatPercent(metrics.winRate),
      subtitle: `${metrics.wonDeals} ganados / ${metrics.wonDeals + metrics.lostDeals} decididos`,
      icon: Briefcase,
      borderColor: 'border-l-orange-500',
    },
  ]

  // KPI Cards Row 2 - m2 Metrics
  const m2KPIs: KPICardData[] = [
    {
      title: 'm2 en Pipeline',
      value: formatM2(metrics.totalM2Pipeline),
      subtitle: `En ${metrics.openDeals} negocios abiertos`,
      icon: Ruler,
      borderColor: 'border-l-teal-500',
    },
    {
      title: 'm2 Ganados',
      value: formatM2(metrics.totalM2Won),
      subtitle: `En ${metrics.wonDeals} negocios ganados`,
      icon: Award,
      borderColor: 'border-l-green-500',
    },
    {
      title: '$/m2 Promedio Ganado',
      value: formatCurrencyPerM2(metrics.avgPricePerM2Won),
      subtitle: 'Precio promedio por m2 ganado',
      icon: BarChart3,
      borderColor: 'border-l-yellow-500',
    },
    {
      title: 'Perdido',
      value: formatCurrency(metrics.lostAmount),
      subtitle: `${metrics.lostDeals} negocios perdidos`,
      icon: TrendingDown,
      borderColor: 'border-l-red-500',
    },
  ]

  // Chart data: amount by stage (bar)
  const amountByStageData = metrics.stageBreakdown.map(s => ({
    name: s.stageLabel.length > 15 ? s.stageLabel.substring(0, 15) + '...' : s.stageLabel,
    monto: s.totalAmount,
  }))

  // Chart data: m2 by stage (bar)
  const m2ByStageData = metrics.stageBreakdown.map(s => ({
    name: s.stageLabel.length > 15 ? s.stageLabel.substring(0, 15) + '...' : s.stageLabel,
    m2: s.totalM2,
  }))

  return (
    <div className="flex flex-col gap-6">
      {/* Financial KPIs */}
      <KPICards cards={financialKPIs} />

      {/* m2 KPIs */}
      <KPICards cards={m2KPIs} />

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Funnel del Pipeline</CardTitle>
            <CardDescription>Cantidad de deals por etapa (hover para detalles)</CardDescription>
          </CardHeader>
          <CardContent>
            <PipelineFunnel
              stages={metrics.stageBreakdown}
              totalDeals={metrics.totalDeals}
            />
          </CardContent>
        </Card>

        <MetricsChart
          title="Monto por Etapa"
          description="Valor total en cada etapa del pipeline"
          data={amountByStageData}
          series={[{ name: 'Monto', key: 'monto', color: '#0077B6' }]}
          chartType="bar"
          formatterType="currency"
          height={300}
          showLegend={false}
        />
      </div>

      {/* m2 by Stage full width */}
      <MetricsChart
        title="m2 por Etapa"
        description="Metros cuadrados totales en cada etapa del pipeline"
        data={m2ByStageData}
        series={[{ name: 'm2', key: 'm2', color: '#FCCD12' }]}
        chartType="bar"
        formatterType="number"
        height={300}
        showLegend={false}
      />
    </div>
  )
}
