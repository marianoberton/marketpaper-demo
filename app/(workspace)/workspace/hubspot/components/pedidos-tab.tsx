'use client'

import { useEffect, useState, useCallback } from 'react'
import { getPedidosDeals, type PedidosData, type EnrichedDeal } from '@/actions/hubspot-analytics'
import { KPICards, type KPICardData } from './kpi-cards'
import { StageBadge } from './stage-badge'
import { DealDetailSheet } from './deal-detail-sheet'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatM2, formatCurrencyPerM2 } from '@/lib/formatters'
import { Loader2, ShoppingCart, CheckCircle2, Ruler, DollarSign } from 'lucide-react'

interface PedidosTabProps {
  companyId: string
  pipelineId: string
  refreshKey: number
  dateRange?: { from?: string; to?: string }
}

export function PedidosTab({ companyId, pipelineId, refreshKey, dateRange }: PedidosTabProps) {
  const [data, setData] = useState<PedidosData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDeal, setSelectedDeal] = useState<EnrichedDeal | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const fetchData = useCallback(async () => {
    if (!companyId || !pipelineId) return
    try {
      setLoading(true)
      const result = await getPedidosDeals(companyId, pipelineId, dateRange)
      setData(result)
    } catch (err) {
      console.error('Error fetching pedidos', err)
    } finally {
      setLoading(false)
    }
  }, [companyId, pipelineId, dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData, refreshKey])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Cargando pedidos...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <p>No se pudieron cargar los pedidos</p>
      </div>
    )
  }

  const kpis: KPICardData[] = [
    {
      title: 'Ordenes Confirmadas',
      value: String(data.confirmados.length),
      subtitle: 'Pendientes de cierre',
      icon: ShoppingCart,
      borderColor: 'border-l-green-500',
    },
    {
      title: 'Cerrados Ganados',
      value: String(data.cerradosGanados.length),
      subtitle: 'Completados',
      icon: CheckCircle2,
      borderColor: 'border-l-emerald-500',
    },
    {
      title: 'm2 Total',
      value: formatM2(data.totalM2),
      subtitle: 'En todos los pedidos',
      icon: Ruler,
      borderColor: 'border-l-teal-500',
    },
    {
      title: 'Facturacion Total',
      value: formatCurrency(data.totalAmount),
      subtitle: `${data.totalOrders} pedidos totales`,
      icon: DollarSign,
      borderColor: 'border-l-blue-500',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <KPICards cards={kpis} />

      {/* Confirmado / Orden Recibida */}
      {data.confirmados.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">
            Confirmado / Orden Recibida ({data.confirmados.length})
          </h3>
          <DealsTable
            deals={data.confirmados}
            onSelect={(deal) => { setSelectedDeal(deal); setSheetOpen(true) }}
          />
        </div>
      )}

      {/* Cierre Ganado */}
      {data.cerradosGanados.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Cierre Ganado ({data.cerradosGanados.length})
          </h3>
          <DealsTable
            deals={data.cerradosGanados}
            onSelect={(deal) => { setSelectedDeal(deal); setSheetOpen(true) }}
          />
        </div>
      )}

      {data.totalOrders === 0 && (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <p>No hay pedidos registrados</p>
        </div>
      )}

      <DealDetailSheet deal={selectedDeal} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}

function DealsTable({
  deals,
  onSelect,
}: {
  deals: EnrichedDeal[]
  onSelect: (deal: EnrichedDeal) => void
}) {
  return (
    <Card className="overflow-hidden">
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
              <th className="p-3">Condiciones</th>
              <th className="p-3">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {deals.map((deal) => (
              <tr
                key={deal.id}
                className="hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onSelect(deal)}
              >
                <td className="p-3 pl-4 font-medium">
                  {deal.properties.dealname}
                </td>
                <td className="p-3">
                  <div className="flex flex-col">
                    <span className="text-sm">{deal.clienteEmpresa || deal.clienteNombre || '-'}</span>
                    {deal.clienteEmpresa && deal.clienteNombre && (
                      <span className="text-xs text-muted-foreground">{deal.clienteNombre}</span>
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
                <td className="p-3 text-xs text-muted-foreground max-w-[150px] truncate">
                  {deal.condicionesPago || '-'}
                </td>
                <td className="p-3 text-muted-foreground">
                  {deal.properties.closedate
                    ? new Date(deal.properties.closedate).toLocaleDateString('es-AR')
                    : deal.properties.createdate
                      ? new Date(deal.properties.createdate).toLocaleDateString('es-AR')
                      : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
