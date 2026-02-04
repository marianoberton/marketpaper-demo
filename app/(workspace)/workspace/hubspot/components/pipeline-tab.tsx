'use client'

import { useEffect, useState, useCallback } from 'react'
import { getDealsEnriched, type EnrichedDeal, type EnrichedDealsResponse, type HubSpotStage } from '@/actions/hubspot-analytics'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { StageBadge } from './stage-badge'
import { DealDetailSheet } from './deal-detail-sheet'
import { formatCurrency, formatM2, formatCurrencyPerM2 } from '@/lib/formatters'
import { ChevronLeft, ChevronRight, Filter, Loader2, Search } from 'lucide-react'

interface PipelineTabProps {
  companyId: string
  pipelineId: string
  stages: HubSpotStage[]
  refreshKey: number
}

export function PipelineTab({ companyId, pipelineId, stages, refreshKey }: PipelineTabProps) {
  const [deals, setDeals] = useState<EnrichedDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStages, setSelectedStages] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Pagination
  const [pagingCursor, setPagingCursor] = useState<string | undefined>(undefined)
  const [cursorHistory, setCursorHistory] = useState<string[]>([])
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined)

  // Detail sheet
  const [selectedDeal, setSelectedDeal] = useState<EnrichedDeal | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const fetchDeals = useCallback(async () => {
    if (!companyId || !pipelineId) return
    try {
      setLoading(true)
      const data = await getDealsEnriched(
        companyId,
        pipelineId,
        selectedStages.length > 0 ? selectedStages : undefined,
        pagingCursor
      )
      setDeals(data.results)
      setNextCursor(data.paging?.next?.after)
    } catch (err) {
      console.error('Error fetching deals', err)
    } finally {
      setLoading(false)
    }
  }, [companyId, pipelineId, selectedStages, pagingCursor])

  useEffect(() => {
    fetchDeals()
  }, [fetchDeals, refreshKey])

  const toggleStage = (stageId: string) => {
    setPagingCursor(undefined)
    setCursorHistory([])
    setSelectedStages(prev =>
      prev.includes(stageId) ? prev.filter(id => id !== stageId) : [...prev, stageId]
    )
  }

  const onNext = () => {
    if (nextCursor) {
      setCursorHistory(prev => [...prev, pagingCursor || ''])
      setPagingCursor(nextCursor)
    }
  }

  const onPrev = () => {
    const newHistory = [...cursorHistory]
    const prevCursor = newHistory.pop()
    setCursorHistory(newHistory)
    setPagingCursor(prevCursor === '' ? undefined : prevCursor)
  }

  // Client-side search filter
  const filteredDeals = searchQuery
    ? deals.filter(d =>
      d.properties.dealname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.clienteEmpresa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.clienteNombre.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : deals

  return (
    <div className="flex flex-col gap-4">
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por negocio o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9 gap-2">
              <Filter className="h-3.5 w-3.5" />
              {selectedStages.length === 0
                ? 'Todas las etapas'
                : `${selectedStages.length} etapa${selectedStages.length !== 1 ? 's' : ''}`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-0" align="start">
            <div className="p-2 border-b">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs w-full"
                onClick={() => {
                  setSelectedStages([])
                  setPagingCursor(undefined)
                  setCursorHistory([])
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-1">
              {stages.map(stage => (
                <div
                  key={stage.id}
                  className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-sm cursor-pointer"
                  onClick={() => toggleStage(stage.id)}
                >
                  <Checkbox
                    checked={selectedStages.includes(stage.id)}
                    onCheckedChange={() => toggleStage(stage.id)}
                  />
                  <label className="text-sm font-medium leading-none cursor-pointer flex-1">
                    {stage.label}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Deals Table */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 border-b py-4">
          <CardTitle className="text-base">Negocios del Pipeline</CardTitle>
          <CardDescription>
            {selectedStages.length > 0
              ? `Filtrado por ${selectedStages.length} etapa${selectedStages.length !== 1 ? 's' : ''}`
              : 'Mostrando todos los negocios'}
          </CardDescription>
        </CardHeader>

        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-background/60 z-10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left font-medium text-muted-foreground">
                <tr>
                  <th className="p-3 pl-4">Negocio</th>
                  <th className="p-3">Etapa</th>
                  <th className="p-3 text-right">Monto</th>
                  <th className="p-3 text-right">m2</th>
                  <th className="p-3 text-right">$/m2</th>
                  <th className="p-3">Creacion</th>
                  <th className="p-3 text-center">Dias</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-muted-foreground">
                      No se encontraron negocios con estos filtros.
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((deal) => (
                    <tr
                      key={deal.id}
                      className="hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => { setSelectedDeal(deal); setSheetOpen(true) }}
                    >
                      <td className="p-3 pl-4">
                        <div className="flex flex-col">
                          <span className="font-medium hover:text-primary transition-colors">
                            {deal.properties.dealname}
                          </span>
                          {(deal.clienteEmpresa || deal.clienteNombre) && (
                            <span className="text-xs text-muted-foreground">
                              {deal.clienteEmpresa || deal.clienteNombre}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <StageBadge label={deal.stageLabel} />
                      </td>
                      <td className="p-3 text-right font-mono font-medium">
                        {formatCurrency(parseFloat(deal.properties.amount || '0') || 0)}
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground">
                        {deal.m2Total > 0 ? formatM2(deal.m2Total) : '-'}
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground">
                        {deal.precioPromedioM2 > 0 ? formatCurrencyPerM2(deal.precioPromedioM2) : '-'}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {deal.properties.createdate
                          ? new Date(deal.properties.createdate).toLocaleDateString('es-AR')
                          : '-'}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-xs font-medium ${deal.daysSinceCreation > 14 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                          {deal.daysSinceCreation}d
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t flex items-center justify-between bg-muted/30">
          <Button variant="outline" size="sm" onClick={onPrev} disabled={cursorHistory.length === 0 || loading} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            {filteredDeals.length === 0 ? '0 resultados' : `Mostrando ${filteredDeals.length} resultados`}
          </span>
          <Button variant="outline" size="sm" onClick={onNext} disabled={!nextCursor || loading} className="gap-2">
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Deal Detail Sheet */}
      <DealDetailSheet deal={selectedDeal} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}
