'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSeguimientoDeals, type SeguimientoData, type EnrichedDeal } from '@/actions/hubspot-analytics'
import { getPriceIndicator } from '@/lib/hubspot-analytics-types'
import { KPICards, type KPICardData } from './kpi-cards'
import { StageBadge } from './stage-badge'
import { DealDetailSheet } from './deal-detail-sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatM2, formatCurrencyPerM2 } from '@/lib/formatters'
import {
  Loader2, Clock, Users, Ruler, DollarSign,
  Mail, Phone, FileText, ExternalLink, AlertTriangle,
  LayoutGrid, TableIcon, Package, ChevronDown, ChevronUp
} from 'lucide-react'

interface SeguimientoTabProps {
  companyId: string
  pipelineId: string
  refreshKey: number
  dateRange?: { from?: string; to?: string }
}

type ViewMode = 'cards' | 'table'
type SortField = 'daysSinceCreation' | 'amount' | 'm2Total' | 'precioPromedioM2'
type SortDirection = 'asc' | 'desc'

export function SeguimientoTab({ companyId, pipelineId, refreshKey, dateRange }: SeguimientoTabProps) {
  const [data, setData] = useState<SeguimientoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDeal, setSelectedDeal] = useState<EnrichedDeal | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [sortField, setSortField] = useState<SortField>('daysSinceCreation')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc') // Mostrar primero los menos antiguos

  const fetchData = useCallback(async () => {
    if (!companyId || !pipelineId) return
    try {
      setLoading(true)
      const result = await getSeguimientoDeals(companyId, pipelineId, dateRange)
      setData(result)
    } catch (err) {
      console.error('Error fetching seguimiento deals', err)
    } finally {
      setLoading(false)
    }
  }, [companyId, pipelineId, dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData, refreshKey])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortDeals = (deals: EnrichedDeal[]) => {
    return [...deals].sort((a, b) => {
      let aVal: number, bVal: number
      switch (sortField) {
        case 'amount':
          aVal = parseFloat(a.properties.amount || '0') || 0
          bVal = parseFloat(b.properties.amount || '0') || 0
          break
        case 'm2Total':
          aVal = a.m2Total
          bVal = b.m2Total
          break
        case 'precioPromedioM2':
          aVal = a.precioPromedioM2
          bVal = b.precioPromedioM2
          break
        default:
          aVal = a.daysSinceCreation
          bVal = b.daysSinceCreation
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    })
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Cargando deals en seguimiento...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <p>No se pudieron cargar los datos de seguimiento</p>
      </div>
    )
  }

  const kpis: KPICardData[] = [
    {
      title: 'Deals en Seguimiento',
      value: String(data.totalDeals),
      subtitle: `${data.urgente.length} urgentes (+14d)`,
      icon: Users,
      borderColor: 'border-l-orange-500',
    },
    {
      title: 'm2 en Negociacion',
      value: formatM2(data.totalM2),
      subtitle: 'Total presupuestado en seguimiento',
      icon: Ruler,
      borderColor: 'border-l-teal-500',
    },
    {
      title: 'Monto en Juego',
      value: formatCurrency(data.totalAmount),
      subtitle: 'Valor total en negociacion',
      icon: DollarSign,
      borderColor: 'border-l-blue-500',
    },
  ]

  const allDeals = [...data.urgente, ...data.normal]
  const sortedDeals = sortDeals(allDeals)

  return (
    <div className="flex flex-col gap-6">
      <KPICards cards={kpis} columns={3} />

      {/* Price Classification Legend */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Clasificación de Precios m²
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 h-4 w-4 rounded bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800" />
            <div className="flex-1">
              <p className="font-medium text-green-700 dark:text-green-400">Competitivo</p>
              <p className="text-xs text-muted-foreground">≤ $700/m² - Precio dentro del rango competitivo</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-0.5 h-4 w-4 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800" />
            <div className="flex-1">
              <p className="font-medium text-yellow-700 dark:text-yellow-400">Normal</p>
              <p className="text-xs text-muted-foreground">$701-$850/m² - Precio dentro del rango estándar</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-0.5 h-4 w-4 rounded bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800" />
            <div className="flex-1">
              <p className="font-medium text-red-700 dark:text-red-400">Alto</p>
              <p className="text-xs text-muted-foreground">&gt; $850/m² - Precio por encima del rango estándar</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {data.totalDeals} deals en seguimiento
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="gap-1"
          >
            <LayoutGrid className="h-4 w-4" />
            Cards
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="gap-1"
          >
            <TableIcon className="h-4 w-4" />
            Tabla
          </Button>
        </div>
      </div>

      {viewMode === 'cards' ? (
        <>
          {/* Urgente Section (+14 days) */}
          {data.urgente.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <h3 className="text-sm font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                  +14 Dias - Prioridad Alta ({data.urgente.length})
                </h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[...data.urgente]
                  .sort((a, b) => a.daysSinceCreation - b.daysSinceCreation)
                  .map(deal => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      variant="urgente"
                      onClick={() => { setSelectedDeal(deal); setSheetOpen(true) }}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Normal Section (-14 days) */}
          {data.normal.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                -14 Dias - Seguimiento Normal ({data.normal.length})
              </h3>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[...data.normal]
                  .sort((a, b) => a.daysSinceCreation - b.daysSinceCreation)
                  .map(deal => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      variant="normal"
                      onClick={() => { setSelectedDeal(deal); setSheetOpen(true) }}
                    />
                  ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <DealsTable
          deals={sortedDeals}
          onDealClick={(deal) => { setSelectedDeal(deal); setSheetOpen(true) }}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      )}

      {data.totalDeals === 0 && (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <p>No hay negocios en etapa de seguimiento</p>
        </div>
      )}

      <DealDetailSheet companyId={companyId} deal={selectedDeal} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}

function DealCard({
  deal,
  variant,
  onClick,
}: {
  deal: EnrichedDeal
  variant: 'urgente' | 'normal'
  onClick: () => void
}) {
  const amount = parseFloat(deal.properties.amount || '0') || 0
  const borderColor = variant === 'urgente' ? 'border-l-orange-500' : 'border-l-blue-500'
  const priceIndicator = getPriceIndicator(deal.precioPromedioM2)
  const itemsCount = Array.isArray(deal.itemsJson) ? deal.itemsJson.length : 0

  return (
    <Card
      className={`border-l-4 ${borderColor} cursor-pointer hover:shadow-md transition-shadow`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold leading-tight">
            {deal.properties.dealname}
          </CardTitle>
          <Badge
            variant={variant === 'urgente' ? 'destructive' : 'secondary'}
            className="shrink-0 gap-1"
          >
            <Clock className="h-3 w-3" />
            {deal.daysSinceCreation}d
          </Badge>
        </div>
        {/* Cliente - temporalmente oculto hasta corregir datos */}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Monto</p>
            <p className="text-sm font-semibold">{formatCurrency(amount)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">m2</p>
            <p className="text-sm font-semibold">
              {deal.m2Total >= 10 ? formatM2(deal.m2Total) : <span className="text-muted-foreground">Sin datos</span>}
            </p>
          </div>
        </div>

        {/* Price Indicator */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Precio x m2</p>
            <p className="text-sm font-semibold">
              {deal.m2Total >= 10 && deal.precioPromedioM2 > 0 ? (
                formatCurrencyPerM2(deal.precioPromedioM2)
              ) : (
                <span className="text-muted-foreground">Sin datos</span>
              )}
            </p>
          </div>
          {deal.m2Total >= 10 && deal.precioPromedioM2 > 0 && (
            <Badge className={`${priceIndicator.bgColor} ${priceIndicator.color} border-0`}>
              {priceIndicator.label}
            </Badge>
          )}
        </div>

        {/* Items Preview */}
        {itemsCount > 0 && (
          <div className="bg-muted/50 rounded-md p-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Package className="h-3 w-3" />
              <span>{itemsCount} producto{itemsCount > 1 ? 's' : ''} cotizado{itemsCount > 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {(deal.itemsJson as any[]).slice(0, 3).map((item: any, i: number) => (
                <Badge key={i} variant="outline" className="text-[10px] font-normal">
                  {item.mp_tipo_caja || item.name || `Item ${i + 1}`}
                </Badge>
              ))}
              {itemsCount > 3 && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  +{itemsCount - 3} mas
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Contact Actions */}
        <div className="flex flex-wrap gap-2">
          {deal.clienteTelefono && (
            <a
              href={`tel:${deal.clienteTelefono}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <Phone className="h-3 w-3" />
              {deal.clienteTelefono}
            </a>
          )}
          {deal.clienteEmail && (
            <a
              href={`mailto:${deal.clienteEmail}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <Mail className="h-3 w-3" />
              Email
            </a>
          )}
          {deal.pdfPresupuestoUrl && (
            <a
              href={deal.pdfPresupuestoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <FileText className="h-3 w-3" />
              PDF
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>

        {/* Stage Badge */}
        <StageBadge label={deal.stageLabel} />

        {/* Notes preview */}
        {deal.notasRapidas && (
          <p className="text-xs text-muted-foreground line-clamp-2 italic">
            {deal.notasRapidas}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function DealsTable({
  deals,
  onDealClick,
  sortField,
  sortDirection,
  onSort,
}: {
  deals: EnrichedDeal[]
  onDealClick: (deal: EnrichedDeal) => void
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
}) {
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Deal</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSort('amount')}
            >
              <div className="flex items-center gap-1">
                Monto <SortIcon field="amount" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSort('m2Total')}
            >
              <div className="flex items-center gap-1">
                m2 <SortIcon field="m2Total" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSort('precioPromedioM2')}
            >
              <div className="flex items-center gap-1">
                $/m2 <SortIcon field="precioPromedioM2" />
              </div>
            </TableHead>
            <TableHead>Indicador</TableHead>
            <TableHead>Items</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSort('daysSinceCreation')}
            >
              <div className="flex items-center gap-1">
                Dias <SortIcon field="daysSinceCreation" />
              </div>
            </TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => {
            const amount = parseFloat(deal.properties.amount || '0') || 0
            const priceIndicator = getPriceIndicator(deal.precioPromedioM2)
            const itemsCount = Array.isArray(deal.itemsJson) ? deal.itemsJson.length : 0

            return (
              <TableRow
                key={deal.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onDealClick(deal)}
              >
                <TableCell className="font-medium max-w-[200px]">
                  <div className="truncate">{deal.properties.dealname}</div>
                  <div className="text-xs text-muted-foreground">
                    <StageBadge label={deal.stageLabel} />
                  </div>
                </TableCell>
                <TableCell className="max-w-[150px]">
                  <div className="truncate">
                    {deal.associatedCompanyName || deal.clienteEmpresa || deal.clienteNombre || '-'}
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(amount)}</TableCell>
                <TableCell>
                  {deal.m2Total >= 10 ? formatM2(deal.m2Total) : <span className="text-muted-foreground">Sin datos</span>}
                </TableCell>
                <TableCell>
                  {deal.m2Total >= 10 && deal.precioPromedioM2 > 0 ? (
                    formatCurrencyPerM2(deal.precioPromedioM2)
                  ) : (
                    <span className="text-muted-foreground">Sin datos</span>
                  )}
                </TableCell>
                <TableCell>
                  {deal.m2Total >= 10 && deal.precioPromedioM2 > 0 && (
                    <Badge className={`${priceIndicator.bgColor} ${priceIndicator.color} border-0 text-xs`}>
                      {priceIndicator.label}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {itemsCount > 0 ? (
                    <Badge variant="outline" className="text-xs">
                      {itemsCount} items
                    </Badge>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={deal.daysSinceCreation > 14 ? 'destructive' : 'secondary'}
                    className="gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    {deal.daysSinceCreation}d
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {deal.clienteTelefono && (
                      <a href={`tel:${deal.clienteTelefono}`} className="p-1 hover:bg-muted rounded">
                        <Phone className="h-4 w-4 text-blue-600" />
                      </a>
                    )}
                    {deal.clienteEmail && (
                      <a href={`mailto:${deal.clienteEmail}`} className="p-1 hover:bg-muted rounded">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </a>
                    )}
                    {deal.pdfPresupuestoUrl && (
                      <a
                        href={deal.pdfPresupuestoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-muted rounded"
                      >
                        <FileText className="h-4 w-4 text-blue-600" />
                      </a>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
