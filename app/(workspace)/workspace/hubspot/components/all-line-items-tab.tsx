'use client'

import { useEffect, useState, useCallback } from 'react'
import { subDays } from 'date-fns'
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
import { DateRangePicker } from './date-range-picker'
import { formatCurrency, formatM2 } from '@/lib/formatters'
import type { DateRange } from '@/lib/hubspot-analytics-types'
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

/**
 * Calcula m² de una caja según su tipo
 * Todas las medidas de entrada están en milímetros
 */
function calculateM2PerUnit(
  tipo: string | null | undefined,
  largo: number,
  ancho: number,
  alto: number
): number {
  if (!tipo || largo <= 0 || ancho <= 0) return 0

  const tipoLower = tipo.toLowerCase().trim()
  let largoPlancha = 0
  let anchoPlancha = 0

  if (tipoLower.includes('dos planchas') || tipoLower.includes('2 planchas')) {
    // Dos Planchas = Una Caja
    largoPlancha = largo + ancho + 40
    anchoPlancha = ancho + alto
    return ((largoPlancha * anchoPlancha) * 2) / 1000000
  } else if (tipoLower.includes('bandeja')) {
    // Bandeja
    largoPlancha = largo + (2 * alto) + 30
    anchoPlancha = ancho + (2 * alto)
  } else if (tipoLower.includes('cerco')) {
    // Cerco
    largoPlancha = 2 * (largo - 10) + 2 * (ancho - 10) + 40
    anchoPlancha = ancho + alto
  } else if (tipoLower.includes('aleta cruzada') && tipoLower.includes('x2')) {
    // Caja Aleta Cruzada (x2 Lados)
    largoPlancha = (2 * largo) + (2 * ancho) + 40
    anchoPlancha = (2 * ancho) + largo - 20
  } else if (tipoLower.includes('aleta cruzada') && tipoLower.includes('x1')) {
    // Caja Aleta Cruzada (x1 Lado)
    largoPlancha = (2 * largo) + (2 * ancho) + 40
    anchoPlancha = ancho + (0.5 * ancho) + alto - 10
  } else if (tipoLower.includes('telescópica') || tipoLower.includes('telescopica')) {
    // Base o Tapa Telescópica
    largoPlancha = (2 * largo) + (2 * ancho) + 50
    anchoPlancha = (0.5 * ancho) + alto
  } else if (tipoLower.includes('plancha')) {
    // Plancha Simple
    largoPlancha = largo
    anchoPlancha = ancho
  } else {
    // Caja Aleta Simple (Estándar) - default
    largoPlancha = (2 * largo) + (2 * ancho) + 40
    anchoPlancha = ancho + alto
  }

  return (largoPlancha * anchoPlancha) / 1000000
}

export function AllLineItemsTab({
  companyId,
  pipelineId,
  stages,
  refreshKey,
  dateRange
}: AllLineItemsTabProps) {
  // Pre-filtrar solo etapa "Cierre Ganado"
  const wonStages = stages.filter(s =>
    s.label.toLowerCase().includes('ganado') &&
    s.label.toLowerCase().includes('cierre')
  )

  // Default: últimas 2 semanas
  const [localDateRange, setLocalDateRange] = useState<DateRange>({
    from: subDays(new Date(), 14),
    to: new Date()
  })

  const [lineItems, setLineItems] = useState<ExtendedLineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStages, setSelectedStages] = useState<string[]>(
    wonStages.map(s => s.id)
  )
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 })

  const fetchData = useCallback(async () => {
    if (!companyId || !pipelineId) return

    try {
      setLoading(true)
      setLineItems([])

      // Usar el rango de fechas del estado
      const dateRangeParam = localDateRange.from || localDateRange.to
        ? {
            from: localDateRange.from?.toISOString(),
            to: localDateRange.to?.toISOString()
          }
        : undefined

      // Obtener solo los primeros 20 deals cerrados en el rango seleccionado
      const dealsResponse = await getDealsEnriched(
        companyId,
        pipelineId,
        selectedStages.length > 0 ? selectedStages : undefined,
        undefined,
        dateRangeParam
      )

      const deals = dealsResponse.results.slice(0, 20) // Limitar a 20 deals
      setLoadingProgress({ current: 0, total: deals.length })

      // Obtener line items de cada deal (máximo 20 deals)
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
  }, [companyId, pipelineId, selectedStages, localDateRange])

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
        deal.associatedCompanyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.clienteEmpresa?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.clienteNombre?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : lineItems

  // Calcular totales
  const totalQuantity = filteredItems.reduce(
    (sum, { item }) => sum + (parseFloat(item.properties.quantity || '0') || 0),
    0
  )
  const totalM2 = filteredItems.reduce(
    (sum, { item }) => {
      const quantity = parseFloat(item.properties.quantity || '0')
      const largo = parseFloat(item.properties.mp_largo_mm || '0')
      const ancho = parseFloat(item.properties.mp_ancho_mm || '0')
      const alto = parseFloat(item.properties.mp_alto_mm || '0')
      const tipo = item.properties.mp_tipo_caja
      const m2PerUnit = calculateM2PerUnit(tipo, largo, ancho, alto)
      return sum + (m2PerUnit * quantity)
    },
    0
  )
  const totalAmount = filteredItems.reduce(
    (sum, { item }) => sum + (parseFloat(item.properties.amount || '0') || 0),
    0
  )

  const handleExportCSV = () => {
    if (filteredItems.length === 0) return

    const headers = [
      'Deal', 'Cliente', 'Item', 'Cantidad', 'Largo (mm)', 'Ancho (mm)', 'Alto (mm)',
      'm2 por Unidad (Calc)', 'm2 Totales (Calc)', 'Tipo', 'Precio Unitario', 'Subtotal SIN IVA', 'Fecha Creación', 'Fecha Cierre'
    ]

    const rows = filteredItems.map(({ item, deal }) => {
      const quantity = parseFloat(item.properties.quantity || '0')
      const largo = parseFloat(item.properties.mp_largo_mm || '0')
      const ancho = parseFloat(item.properties.mp_ancho_mm || '0')
      const alto = parseFloat(item.properties.mp_alto_mm || '0')
      const tipo = item.properties.mp_tipo_caja
      const m2PerUnit = calculateM2PerUnit(tipo, largo, ancho, alto)
      const m2Total = m2PerUnit * quantity

      return [
        deal.properties.dealname,
        deal.associatedCompanyName || deal.clienteEmpresa || deal.clienteNombre || '-',
        item.properties.name || '-',
        quantity,
        largo,
        ancho,
        item.properties.mp_alto_mm || '0',
        m2PerUnit.toFixed(4),
        m2Total.toFixed(2),
        item.properties.mp_tipo_caja || '-',
        item.properties.price || '0',
        item.properties.amount || '0',
        deal.properties.createdate
          ? new Date(deal.properties.createdate).toLocaleDateString('es-AR')
          : '-',
        deal.properties.closedate
          ? new Date(deal.properties.closedate).toLocaleDateString('es-AR')
          : '-'
      ]
    })

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

        <DateRangePicker
          dateRange={localDateRange}
          onDateRangeChange={setLocalDateRange}
        />

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
      <div className="grid gap-4 md:grid-cols-4">
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
              <span className="text-sm text-muted-foreground">m2 Totales</span>
            </div>
            <p className="text-2xl font-bold">{formatM2(totalM2)}</p>
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
                  <th className="p-3 pl-4">Deal</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Item</th>
                  <th className="p-3 text-right">Cant.</th>
                  <th className="p-3 text-right">Largo (mm)</th>
                  <th className="p-3 text-right">Ancho (mm)</th>
                  <th className="p-3 text-right">Alto (mm)</th>
                  <th className="p-3 text-right" title="Calculado según tipo de caja (ver nota al pie)">m2/u*</th>
                  <th className="p-3 text-right" title="Calculado: m2/u × Cantidad">m2 Tot*</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3 text-right">$ Unit.</th>
                  <th className="p-3 text-right">Subtotal</th>
                  <th className="p-3">Fecha Creación</th>
                  <th className="p-3">Fecha Cierre</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={14} className="p-12 text-center text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No se encontraron line items</p>
                      {selectedStages.length > 0 && (
                        <p className="text-xs mt-1">Intenta cambiar los filtros</p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(({ item, deal }, idx) => {
                    const quantity = parseFloat(item.properties.quantity || '0')
                    const largo = parseFloat(item.properties.mp_largo_mm || '0')
                    const ancho = parseFloat(item.properties.mp_ancho_mm || '0')
                    const alto = parseFloat(item.properties.mp_alto_mm || '0')
                    const tipo = item.properties.mp_tipo_caja
                    const m2PerUnit = calculateM2PerUnit(tipo, largo, ancho, alto)
                    const m2Total = m2PerUnit * quantity

                    return (
                      <tr
                        key={`${deal.id}-${item.id}-${idx}`}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-3 pl-4 max-w-[150px]">
                          <span className="truncate block text-xs font-medium" title={deal.properties.dealname}>
                            {deal.properties.dealname}
                          </span>
                        </td>
                        <td className="p-3 max-w-[120px]">
                          <span className="truncate block text-xs">
                            {deal.associatedCompanyName || deal.clienteEmpresa || deal.clienteNombre || '-'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="text-xs">
                              {item.properties.name || 'Sin nombre'}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono text-xs">
                          {quantity.toLocaleString('es-AR')}
                        </td>
                        <td className="p-3 text-right font-mono text-xs text-muted-foreground">
                          {largo > 0 ? largo.toLocaleString('es-AR') : '-'}
                        </td>
                        <td className="p-3 text-right font-mono text-xs text-muted-foreground">
                          {ancho > 0 ? ancho.toLocaleString('es-AR') : '-'}
                        </td>
                        <td className="p-3 text-right font-mono text-xs text-muted-foreground">
                          {alto > 0 ? alto.toLocaleString('es-AR') : '-'}
                        </td>
                        <td className="p-3 text-right font-mono text-xs" title={`Calculado según tipo: ${tipo || 'Aleta Simple'}`}>
                          {m2PerUnit > 0 ? formatM2(m2PerUnit) : '-'}
                        </td>
                        <td className="p-3 text-right font-mono text-xs font-medium" title={`Calculado: ${formatM2(m2PerUnit)} × ${quantity}`}>
                          {m2Total > 0 ? formatM2(m2Total) : '-'}
                        </td>
                        <td className="p-3 text-xs">
                          {item.properties.mp_tipo_caja || '-'}
                        </td>
                        <td className="p-3 text-right font-mono text-xs text-muted-foreground">
                          {formatCurrency(parseFloat(item.properties.price || '0'))}
                        </td>
                        <td className="p-3 text-right font-mono text-xs font-medium">
                          {formatCurrency(parseFloat(item.properties.amount || '0'))}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                          {deal.properties.createdate
                            ? new Date(deal.properties.createdate).toLocaleDateString('es-AR')
                            : '-'}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                          {deal.properties.closedate
                            ? new Date(deal.properties.closedate).toLocaleDateString('es-AR')
                            : '-'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
              {filteredItems.length > 0 && (
                <tfoot className="bg-muted/50 font-semibold border-t-2">
                  <tr>
                    <td colSpan={3} className="p-3 pl-4 text-right text-xs uppercase tracking-wider text-muted-foreground">
                      Totales
                    </td>
                    <td className="p-3 text-right font-mono text-xs">
                      {totalQuantity.toLocaleString('es-AR')}
                    </td>
                    <td colSpan={4} className="p-3" />
                    <td className="p-3 text-right font-mono text-xs">
                      {formatM2(totalM2)}
                    </td>
                    <td className="p-3" />
                    <td className="p-3" />
                    <td className="p-3 text-right font-mono text-xs">
                      {formatCurrency(totalAmount)}
                    </td>
                    <td className="p-3" />
                    <td className="p-3" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            * <strong>m2/u</strong>: Metros cuadrados por unidad, calculado según el tipo de caja (Aleta Simple, Dos Planchas, Bandeja, Cerco, Aleta Cruzada, Telescópica, o Plancha)
            <br />
            * <strong>m2 Tot</strong>: Metros cuadrados totales, calculado como m2/u × Cantidad
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
