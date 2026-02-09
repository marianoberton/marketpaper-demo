'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { 
  analyzeDealsPrice, 
  generateDealActionPlan,
  type DealPriceAnalysis,
  type PriceAnalysisStats,
  type ActionPlan 
} from '@/actions/hubspot-price-analysis'
import { getDealsEnriched, type EnrichedDeal, type HubSpotStage } from '@/actions/hubspot-analytics'
import { PriceIndicator, PriceStatsCard } from './price-indicator'
import { ActionPlanCard } from './action-plan-card'
import { StageBadge } from './stage-badge'
import { formatCurrency, formatM2, formatCurrencyPerM2 } from '@/lib/formatters'
import { 
  Search, 
  Loader2, 
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles,
  ChevronRight,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'

interface PriceAnalysisTabProps {
  companyId: string
  pipelineId: string
  stages: HubSpotStage[]
  refreshKey: number
}

export function PriceAnalysisTab({ 
  companyId, 
  pipelineId, 
  stages,
  refreshKey 
}: PriceAnalysisTabProps) {
  const [analyses, setAnalyses] = useState<DealPriceAnalysis[]>([])
  const [stats, setStats] = useState<PriceAnalysisStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_range' | 'below_market' | 'above_market'>('all')

  // Action Plan Sheet State
  const [selectedDeal, setSelectedDeal] = useState<EnrichedDeal | null>(null)
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [allDeals, setAllDeals] = useState<EnrichedDeal[]>([])

  const fetchData = useCallback(async () => {
    if (!companyId || !pipelineId) return
    try {
      setLoading(true)
      
      // Fetch price analyses
      const { analyses: priceAnalyses, stats: priceStats } = await analyzeDealsPrice(
        companyId, 
        pipelineId
      )
      setAnalyses(priceAnalyses)
      setStats(priceStats)

      // Also fetch enriched deals for action plans
      const dealsResponse = await getDealsEnriched(companyId, pipelineId)
      setAllDeals(dealsResponse.results)
    } catch (err) {
      console.error('Error fetching price analysis', err)
      toast.error('Error al cargar análisis de precios')
    } finally {
      setLoading(false)
    }
  }, [companyId, pipelineId])

  useEffect(() => {
    fetchData()
  }, [fetchData, refreshKey])

  const handleGeneratePlan = async (dealId: string) => {
    const deal = allDeals.find(d => d.id === dealId)
    if (!deal) return

    setSelectedDeal(deal)
    setSheetOpen(true)
    setPlanLoading(true)
    setActionPlan(null)

    try {
      const plan = await generateDealActionPlan(deal)
      setActionPlan(plan)
    } catch (err) {
      console.error('Error generating action plan', err)
      toast.error('Error al generar plan de acción')
    } finally {
      setPlanLoading(false)
    }
  }

  const regeneratePlan = async () => {
    if (!selectedDeal) return
    setPlanLoading(true)
    try {
      const plan = await generateDealActionPlan(selectedDeal)
      setActionPlan(plan)
      toast.success('Plan regenerado')
    } catch (err) {
      toast.error('Error al regenerar plan')
    } finally {
      setPlanLoading(false)
    }
  }

  // Filter analyses
  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = searchQuery
      ? analysis.dealName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        analysis.clientName.toLowerCase().includes(searchQuery.toLowerCase())
      : true

    const matchesFilter = filterStatus === 'all' 
      ? true 
      : analysis.classification.status === filterStatus

    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Precio</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats?.inRange || 0}
                </p>
                <p className="text-xs text-muted-foreground">🟢 Dentro del mercado</p>
              </div>
              <div className="text-3xl">🟢</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Por Debajo</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats?.belowMarket || 0}
                </p>
                <p className="text-xs text-muted-foreground">🟡 Revisar márgenes</p>
              </div>
              <div className="text-3xl">🟡</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Por Encima</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats?.aboveMarket || 0}
                </p>
                <p className="text-xs text-muted-foreground">🔴 Difícil de cerrar</p>
              </div>
              <div className="text-3xl">🔴</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Diferencia Promedio</p>
                <p className="text-2xl font-bold">
                  {stats?.avgDiffPercent || 0 > 0 ? '+' : ''}{stats?.avgDiffPercent || 0}%
                </p>
                <p className="text-xs text-muted-foreground">vs precio de mercado</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por deal o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex gap-1">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            Todos
          </Button>
          <Button
            variant={filterStatus === 'in_range' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('in_range')}
            className="gap-1"
          >
            🟢 En precio
          </Button>
          <Button
            variant={filterStatus === 'below_market' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('below_market')}
            className="gap-1"
          >
            🟡 Por debajo
          </Button>
          <Button
            variant={filterStatus === 'above_market' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('above_market')}
            className="gap-1"
          >
            🔴 Por encima
          </Button>
        </div>
      </div>

      {/* Analysis Table */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 border-b py-4">
          <CardTitle className="text-base">Análisis de Cotizaciones</CardTitle>
          <CardDescription>
            {filteredAnalyses.length} cotizaciones con precio • Comparación vs mercado
          </CardDescription>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left font-medium text-muted-foreground">
              <tr>
                <th className="p-3 pl-4">Deal</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Zona</th>
                <th className="p-3 text-right">Precio/m²</th>
                <th className="p-3 text-right">m² Total</th>
                <th className="p-3">Clasificación</th>
                <th className="p-3 text-center">Plan IA</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredAnalyses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay cotizaciones con precios para analizar</p>
                  </td>
                </tr>
              ) : (
                filteredAnalyses.map((analysis) => (
                  <tr
                    key={analysis.dealId}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-3 pl-4">
                      <span className="font-medium">{analysis.dealName}</span>
                    </td>
                    <td className="p-3">
                      {analysis.clientName}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {analysis.zone}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {formatCurrencyPerM2(analysis.quotedPriceM2)}
                    </td>
                    <td className="p-3 text-right font-mono text-muted-foreground">
                      {formatM2(analysis.totalM2)}
                    </td>
                    <td className="p-3">
                      <PriceIndicator 
                        classification={analysis.classification} 
                        showDetails 
                      />
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleGeneratePlan(analysis.dealId)}
                      >
                        <Sparkles className="h-4 w-4" />
                        Generar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Action Plan Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Plan de Acción</SheetTitle>
            <SheetDescription>
              {selectedDeal?.properties.dealname}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Deal Summary */}
            {selectedDeal && (
              <Card>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Cliente</span>
                    <span className="font-medium">
                      {selectedDeal.clienteEmpresa || selectedDeal.clienteNombre}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Monto</span>
                    <span className="font-mono">
                      {formatCurrency(parseFloat(selectedDeal.properties.amount || '0'))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">m² Total</span>
                    <span className="font-mono">{formatM2(selectedDeal.m2Total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Días en pipeline</span>
                    <Badge variant={selectedDeal.daysSinceCreation > 14 ? 'destructive' : 'secondary'}>
                      {selectedDeal.daysSinceCreation}d
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Plan */}
            <ActionPlanCard 
              plan={actionPlan} 
              loading={planLoading}
              onRegenerate={regeneratePlan}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
