'use client'

import { useEffect, useState, useCallback } from 'react'
import { getReportData, getItemsReport, type ReportData, type ItemsReportData, type EnrichedDeal } from '@/actions/hubspot-analytics'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StageBadge } from './stage-badge'
import { DealDetailSheet } from './deal-detail-sheet'
import { CSVExportButton } from './csv-export-button'
import { ItemsReportTable } from './items-report-table'
import { formatCurrency, formatM2, formatCurrencyPerM2 } from '@/lib/formatters'
import { Loader2, Search } from 'lucide-react'

interface ReportesTabProps {
  companyId: string
  pipelineId: string
  refreshKey: number
  dateRange?: { from?: string; to?: string }
}

export function ReportesTab({ companyId, pipelineId, refreshKey, dateRange }: ReportesTabProps) {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDeal, setSelectedDeal] = useState<EnrichedDeal | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Items sub-tab state
  const [activeSubTab, setActiveSubTab] = useState('por-negocio')
  const [itemsData, setItemsData] = useState<ItemsReportData | null>(null)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [itemsFetched, setItemsFetched] = useState(false)

  const fetchData = useCallback(async () => {
    if (!companyId || !pipelineId) return
    try {
      setLoading(true)
      const result = await getReportData(companyId, pipelineId, dateRange)
      setData(result)
    } catch (err) {
      console.error('Error fetching report data', err)
    } finally {
      setLoading(false)
    }
  }, [companyId, pipelineId, dateRange])

  useEffect(() => {
    fetchData()
    setItemsFetched(false)
    setItemsData(null)
  }, [fetchData, refreshKey])

  // Lazy-load items data when sub-tab is activated
  useEffect(() => {
    if (activeSubTab === 'por-items' && !itemsFetched && !itemsLoading && companyId && pipelineId) {
      setItemsLoading(true)
      getItemsReport(companyId, pipelineId, dateRange)
        .then(result => {
          setItemsData(result)
          setItemsFetched(true)
        })
        .catch(err => console.error('Error fetching items report', err))
        .finally(() => setItemsLoading(false))
    }
  }, [activeSubTab, itemsFetched, itemsLoading, companyId, pipelineId, dateRange])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Generando reportes...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <p>No se pudieron cargar los reportes</p>
      </div>
    )
  }

  // Client-side search
  const filteredDeals = searchQuery
    ? data.allDeals.filter(d =>
      d.properties.dealname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.clienteEmpresa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.clienteNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.stageLabel.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : data.allDeals

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="por-negocio">Por Negocio</TabsTrigger>
          <TabsTrigger value="por-items">Por Items</TabsTrigger>
        </TabsList>

        <TabsContent value="por-negocio" className="mt-4">
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30 border-b py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Todos los Negocios</CardTitle>
                <CardDescription>{data.allDeals.length} negocios totales</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 w-[200px]"
                  />
                </div>
                <CSVExportButton deals={filteredDeals} filename="hubspot-reporte" />
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left font-medium text-muted-foreground">
                  <tr>
                    <th className="p-3 pl-4">Negocio</th>
                    <th className="p-3">Cliente</th>
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
                      <td colSpan={8} className="p-12 text-center text-muted-foreground">
                        No se encontraron negocios.
                      </td>
                    </tr>
                  ) : (
                    filteredDeals.map((deal) => (
                      <tr
                        key={deal.id}
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => { setSelectedDeal(deal); setSheetOpen(true) }}
                      >
                        <td className="p-3 pl-4 font-medium">
                          {deal.properties.dealname}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span>{deal.clienteEmpresa || deal.clienteNombre || '-'}</span>
                            {deal.clienteEmail && (
                              <span className="text-xs text-muted-foreground">{deal.clienteEmail}</span>
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
          </Card>
        </TabsContent>

        <TabsContent value="por-items" className="mt-4">
          {itemsLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>Cargando reporte de items...</p>
              </div>
            </div>
          ) : itemsData ? (
            <ItemsReportTable data={itemsData} />
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              <p>No se pudo cargar el reporte de items</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DealDetailSheet companyId={companyId} deal={selectedDeal} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}
