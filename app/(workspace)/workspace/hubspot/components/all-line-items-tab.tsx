'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  getDealsEnriched, 
  getDealLineItems,
  type EnrichedDeal, 
  type HubSpotLineItem,
  type HubSpotStage 
} from '@/actions/hubspot-analytics'
import { StageBadge } from './stage-badge'
import { CSVExportButton } from './csv-export-button'
import { formatCurrency, formatM2 } from '@/lib/formatters'
import { 
  Search, 
  Filter, 
  Loader2, 
  Package,
  Download,
  ChevronDown
} from 'lucide-react'

interface AllLineItemsTabProps {
  companyId: string
  pipelineId: string
  stages: HubSpotStage[]
  refreshKey: number
  dateRange?: { from?: string; to?: string }
}

interface ExtendedLineItem {
  item: HubSpotLineItem
  deal: EnrichedDeal
}

export function AllLineItemsTab({ 
  companyId, 
  pipelineId, 
  stages,
  refreshKey,
  dateRange 
}: AllLineItemsTabProps) {
  const [lineItems, setLineItems] = useState<ExtendedLineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStages, setSelectedStages] = useState<string[]>([])
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 })

  const fetchData = useCallback(async () => {
    if (!companyId || !pipelineId) return
    
    try {
      setLoading(true)
      setLineItems([])
      
      // Obtener todos los deals
      const dealsResponse = await getDealsEnriched(
        companyId, 
        pipelineId, 
        selectedStages.length > 0 ? selectedStages : undefined
      )
      
      const deals = dealsResponse.results
      setLoadingProgress({ current: 0, total: deals.length })

      // Obtener line items de cada deal
      const allItems: ExtendedLineItem[] = []
      
      for (let i = 0; i < deals.length; i++) {
        const deal = deals[i]
        setLoadingProgress({ current: i + 1, total: deals.length })
        
        try {
          const items = await getDealLineItems(companyId, deal.id)
          for (const item of items) {
            allItems.push({ item, deal })
          }
        } catch (err) {
          console.error(`Error fetching items for deal ${deal.id}:`, err)
        }
      }

      setLineItems(allItems)
    } catch (err) {
      console.error('Error fetching line items:', err)
    } finally {
      setLoading(false)
    }
  }, [companyId, pipelineId, selectedStages])

  useEffect(() => {
    fetchData()
  }, [fetchData, refreshKey])

  const toggleStage = (stageId: string) => {
    setSelectedStages(prev =>
      prev.includes(stageId) ? prev.filter(id => id !== stageId) : [...prev, stageId]
    )
  }

  // Filtrar por búsqueda
  const filteredItems = searchQuery
    ? lineItems.filter(({ item, deal }) =>
        item.properties.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.properties.dealname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.clienteEmpresa?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.clienteNombre?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : lineItems

  // Calcular totales
  const totalQuantity = filteredItems.reduce(
    (sum, { item }) => sum + (parseFloat(item.properties.quantity || '0') || 0),
    0
  )
  const totalAmount = filteredItems.reduce(
    (sum, { item }) => sum + (parseFloat(item.properties.amount || '0') || 0),
    0
  )

  const handleExportCSV = () => {
    if (filteredItems.length === 0) return

    const headers = [
      'Deal', 'Cliente', 'Etapa', 'Item', 'SKU', 
      'Cantidad', 'Precio Unitario', 'Total', 'Fecha'
    ]

    const rows = filteredItems.map(({ item, deal }) => [
      deal.properties.dealname,
      deal.clienteEmpresa || deal.clienteNombre || '-',
      deal.stageLabel,
      item.properties.name || '-',
      item.properties.hs_sku || '-',
      item.properties.quantity || '0',
      item.properties.price || '0',
      item.properties.amount || '0',
      deal.properties.createdate 
        ? new Date(deal.properties.createdate).toLocaleDateString('es-AR')
        : '-'
    ])

    const csv = [headers, ...rows]
      .map(row =>
        row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n')

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hubspot-line-items_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por item, deal o cliente..."
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
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-0" align="start">
            <div className="p-2 border-b">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs w-full"
                onClick={() => setSelectedStages([])}
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

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={filteredItems.length === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Items</span>
            </div>
            <p className="text-2xl font-bold">{filteredItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Cantidad Total</span>
            </div>
            <p className="text-2xl font-bold">{totalQuantity.toLocaleString('es-AR')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Monto Total</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 border-b py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Line Items del Pipeline</CardTitle>
              <CardDescription>
                {loading 
                  ? `Cargando... ${loadingProgress.current}/${loadingProgress.total} deals`
                  : `${filteredItems.length} items de ${lineItems.length} total`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-background/60 z-10 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Procesando deal {loadingProgress.current} de {loadingProgress.total}...
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left font-medium text-muted-foreground">
                <tr>
                  <th className="p-3 pl-4">Item</th>
                  <th className="p-3">Deal</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Etapa</th>
                  <th className="p-3 text-right">Cantidad</th>
                  <th className="p-3 text-right">Precio Unit.</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No se encontraron line items</p>
                      {selectedStages.length > 0 && (
                        <p className="text-xs mt-1">Intenta cambiar los filtros</p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(({ item, deal }, idx) => (
                    <tr
                      key={`${deal.id}-${item.id}-${idx}`}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-3 pl-4">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {item.properties.name || 'Sin nombre'}
                          </span>
                          {item.properties.hs_sku && (
                            <span className="text-xs text-muted-foreground">
                              SKU: {item.properties.hs_sku}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 max-w-[150px]">
                        <span className="truncate block" title={deal.properties.dealname}>
                          {deal.properties.dealname}
                        </span>
                      </td>
                      <td className="p-3">
                        {deal.clienteEmpresa || deal.clienteNombre || '-'}
                      </td>
                      <td className="p-3">
                        <StageBadge label={deal.stageLabel} />
                      </td>
                      <td className="p-3 text-right font-mono">
                        {parseFloat(item.properties.quantity || '0').toLocaleString('es-AR')}
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground">
                        {formatCurrency(parseFloat(item.properties.price || '0'))}
                      </td>
                      <td className="p-3 text-right font-mono font-medium">
                        {formatCurrency(parseFloat(item.properties.amount || '0'))}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {deal.properties.createdate
                          ? new Date(deal.properties.createdate).toLocaleDateString('es-AR')
                          : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredItems.length > 0 && (
                <tfoot className="bg-muted/50 font-semibold border-t-2">
                  <tr>
                    <td colSpan={4} className="p-3 pl-4 text-right text-xs uppercase tracking-wider text-muted-foreground">
                      Totales
                    </td>
                    <td className="p-3 text-right font-mono">
                      {totalQuantity.toLocaleString('es-AR')}
                    </td>
                    <td className="p-3" />
                    <td className="p-3 text-right font-mono">
                      {formatCurrency(totalAmount)}
                    </td>
                    <td className="p-3" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}
