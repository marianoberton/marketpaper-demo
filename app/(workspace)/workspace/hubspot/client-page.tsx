'use client'

import { useEffect, useState } from 'react'
import {
  getHubSpotPipelines,
  getHubSpotPipelineStages,
  type HubSpotPipeline,
  type HubSpotStage
} from '@/actions/hubspot-analytics'
import type { DateRange } from '@/lib/hubspot-analytics-types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, RefreshCcw } from 'lucide-react'
import { useWorkspace } from '@/components/workspace-context'

import { OverviewTab } from './components/overview-tab'
import { SeguimientoTab } from './components/seguimiento-tab'
import { PedidosTab } from './components/pedidos-tab'
import { AllLineItemsTab } from './components/all-line-items-tab'
import { DailyReport } from './components/daily-report'
import { DateRangePicker } from './components/date-range-picker'

export default function HubSpotClientPage() {
  const { companyId } = useWorkspace()
  const [pipelines, setPipelines] = useState<HubSpotPipeline[]>([])
  const [stages, setStages] = useState<HubSpotStage[]>([])
  const [selectedPipeline, setSelectedPipeline] = useState<string>('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined })

  // Convert DateRange to serializable format for server actions
  const dateRangeForServer = {
    from: dateRange.from?.toISOString(),
    to: dateRange.to?.toISOString(),
  }

  // Load pipelines on mount
  useEffect(() => {
    if (!companyId) return

    async function loadPipelines() {
      if (!companyId) return
      try {
        const p = await getHubSpotPipelines(companyId)
        setPipelines(p)

        const targetPipeline = '804074768'
        if (p.some(pi => pi.id === targetPipeline)) {
          setSelectedPipeline(targetPipeline)
        } else if (p.length > 0) {
          setSelectedPipeline(p[0].id)
        }
      } catch (err) {
        console.error('Error loading pipelines', err)
      } finally {
        setInitialLoading(false)
      }
    }
    loadPipelines()
  }, [companyId])

  // Load stages when pipeline changes
  useEffect(() => {
    if (!companyId || !selectedPipeline) {
      setStages([])
      return
    }

    async function loadStages() {
      if (!companyId) return
      try {
        const s = await getHubSpotPipelineStages(companyId, selectedPipeline)
        setStages(s)
      } catch (err) {
        console.error('Error loading stages', err)
      }
    }
    loadStages()
  }, [companyId, selectedPipeline])

  const handleRefresh = () => {
    setRefreshing(true)
    setRefreshKey(prev => prev + 1)
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handlePipelineChange = (value: string) => {
    setSelectedPipeline(value)
    setRefreshKey(prev => prev + 1)
  }

  if (initialLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Conectando con HubSpot...</p>
        </div>
      </div>
    )
  }

  if (!companyId || !selectedPipeline) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <p>No se pudo conectar con HubSpot. Verifica la integracion.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-20">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Live Data
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Date Range Picker */}
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={(range) => {
              setDateRange(range)
              setRefreshKey(prev => prev + 1)
            }}
          />

          {/* Pipeline Selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Pipeline</span>
            <Select value={selectedPipeline} onValueChange={handlePipelineChange}>
              <SelectTrigger className="w-[200px] h-9">
                <SelectValue placeholder="Pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-transparent uppercase tracking-wider font-semibold select-none">.</span>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="resumen" className="w-full">
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="resumen" className="flex-shrink-0">Resumen</TabsTrigger>
          <TabsTrigger value="seguimiento" className="flex-shrink-0">Seguimiento</TabsTrigger>
          <TabsTrigger value="pedidos" className="flex-shrink-0">Pedidos</TabsTrigger>
          <TabsTrigger value="items" className="flex-shrink-0">Line Items (Fabian)</TabsTrigger>
          <TabsTrigger value="diario" className="flex-shrink-0">Reporte Diario</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-6">
          <OverviewTab
            companyId={companyId}
            pipelineId={selectedPipeline}
            refreshKey={refreshKey}
            dateRange={dateRangeForServer}
          />
        </TabsContent>

        <TabsContent value="seguimiento" className="mt-6">
          <SeguimientoTab
            companyId={companyId}
            pipelineId={selectedPipeline}
            refreshKey={refreshKey}
            dateRange={dateRangeForServer}
          />
        </TabsContent>

        <TabsContent value="pedidos" className="mt-6">
          <PedidosTab
            companyId={companyId}
            pipelineId={selectedPipeline}
            refreshKey={refreshKey}
            dateRange={dateRangeForServer}
          />
        </TabsContent>

        <TabsContent value="items" className="mt-6">
          <AllLineItemsTab
            companyId={companyId}
            pipelineId={selectedPipeline}
            stages={stages}
            refreshKey={refreshKey}
            dateRange={dateRangeForServer}
          />
        </TabsContent>

        <TabsContent value="diario" className="mt-6">
          <DailyReport
            companyId={companyId}
            pipelineId={selectedPipeline}
            refreshKey={refreshKey}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
