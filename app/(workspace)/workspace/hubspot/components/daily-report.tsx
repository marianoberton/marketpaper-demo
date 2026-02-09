'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { getDailyReportData, type DailyReportData } from '@/actions/hubspot-price-analysis'
import { type EnrichedDeal } from '@/actions/hubspot-analytics'
import { StageBadge } from './stage-badge'
import { PriceStatsCard } from './price-indicator'
import { formatCurrency, formatM2 } from '@/lib/formatters'
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target,
  Download,
  Mail,
  Loader2,
  ChevronRight
} from 'lucide-react'

interface DailyReportProps {
  companyId: string
  pipelineId: string
  refreshKey: number
}

export function DailyReport({ companyId, pipelineId, refreshKey }: DailyReportProps) {
  const [data, setData] = useState<DailyReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )

  const fetchData = useCallback(async () => {
    if (!companyId || !pipelineId) return
    try {
      setLoading(true)
      const result = await getDailyReportData(companyId, pipelineId, selectedDate)
      setData(result)
    } catch (err) {
      console.error('Error fetching daily report', err)
    } finally {
      setLoading(false)
    }
  }, [companyId, pipelineId, selectedDate])

  useEffect(() => {
    fetchData()
  }, [fetchData, refreshKey])

  const handleExportPDF = async () => {
    if (!data) return

    // Generar HTML para PDF
    const html = generatePDFContent(data)
    
    // Abrir en nueva ventana para imprimir/guardar como PDF
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  const handleSendEmail = async () => {
    // TODO: Implementar envío por email usando Resend
    alert('Funcionalidad de email próximamente')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <p>No se pudo cargar el reporte</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con selector de fecha */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <span className="text-sm text-muted-foreground">
            {new Date(selectedDate).toLocaleDateString('es-AR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-1" />
            Exportar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleSendEmail}>
            <Mail className="h-4 w-4 mr-1" />
            Enviar por Email
          </Button>
        </div>
      </div>

      {/* KPIs del día */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Nuevos Leads"
          value={data.newLeads.length}
          icon={<Target className="h-5 w-5" />}
          color="blue"
          subtitle="Creados hoy"
        />
        <StatCard
          title="Cerrados Ganados"
          value={data.closedWon.length}
          icon={<TrendingUp className="h-5 w-5" />}
          color="green"
          subtitle={formatCurrency(data.closedWon.reduce((s, d) => s + parseFloat(d.properties.amount || '0'), 0))}
        />
        <StatCard
          title="Cerrados Perdidos"
          value={data.closedLost.length}
          icon={<TrendingDown className="h-5 w-5" />}
          color="red"
          subtitle="Oportunidades perdidas"
        />
        <StatCard
          title="Requieren Seguimiento"
          value={data.followUpNeeded.length}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="orange"
          subtitle="+14 días sin avance"
        />
      </div>

      {/* Pipeline Total */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Pipeline Actual</CardTitle>
          <CardDescription>Total de oportunidades abiertas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Monto Total</p>
              <p className="text-3xl font-bold">{formatCurrency(data.totalPipelineAmount)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">m² Total</p>
              <p className="text-3xl font-bold">{formatM2(data.totalPipelineM2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análisis de Precios */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Análisis de Precios m²</CardTitle>
          <CardDescription>Clasificación de cotizaciones vs mercado</CardDescription>
        </CardHeader>
        <CardContent>
          <PriceStatsCard stats={data.priceStats} />
        </CardContent>
      </Card>

      {/* Listas de deals */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Nuevos Leads */}
        <DealListCard
          title="Nuevos Leads del Día"
          icon={<Target className="h-4 w-4 text-blue-500" />}
          deals={data.newLeads}
          emptyMessage="No hay nuevos leads hoy"
        />

        {/* Requieren Seguimiento */}
        <DealListCard
          title="Requieren Seguimiento Urgente"
          icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}
          deals={data.followUpNeeded.slice(0, 5)}
          emptyMessage="No hay deals pendientes de seguimiento"
          showDays
        />
      </div>
    </div>
  )
}

// Componentes auxiliares

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'red' | 'orange'
  subtitle?: string
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  const colors = {
    blue: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20',
    green: 'border-l-green-500 bg-green-50 dark:bg-green-900/20',
    red: 'border-l-red-500 bg-red-50 dark:bg-red-900/20',
    orange: 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20',
  }

  const iconColors = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    red: 'text-red-500',
    orange: 'text-orange-500',
  }

  return (
    <Card className={`border-l-4 ${colors[color]}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-2 rounded-lg bg-background ${iconColors[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface DealListCardProps {
  title: string
  icon: React.ReactNode
  deals: EnrichedDeal[]
  emptyMessage: string
  showDays?: boolean
}

function DealListCard({ title, icon, deals, emptyMessage, showDays }: DealListCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            {deals.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {deals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-2">
            {deals.map(deal => (
              <div 
                key={deal.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">
                    {deal.properties.dealname}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {deal.clienteEmpresa || deal.clienteNombre}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {showDays && (
                    <Badge variant="outline" className="text-xs">
                      {deal.daysSinceCreation}d
                    </Badge>
                  )}
                  <span className="text-sm font-mono">
                    {formatCurrency(parseFloat(deal.properties.amount || '0'))}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Generador de contenido PDF
function generatePDFContent(data: DailyReportData): string {
  const dateStr = new Date(data.date).toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reporte Diario - ${dateStr}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 8px; }
    h2 { color: #333; font-size: 18px; margin-top: 24px; border-bottom: 2px solid #CED600; padding-bottom: 8px; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
    .stats { display: flex; gap: 16px; margin-bottom: 24px; }
    .stat-card { flex: 1; padding: 16px; border-radius: 8px; border: 1px solid #e0e0e0; }
    .stat-card.blue { border-left: 4px solid #3b82f6; }
    .stat-card.green { border-left: 4px solid #22c55e; }
    .stat-card.red { border-left: 4px solid #ef4444; }
    .stat-card.orange { border-left: 4px solid #f97316; }
    .stat-value { font-size: 28px; font-weight: bold; }
    .stat-label { font-size: 12px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
    th { background: #f5f5f5; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    td { font-size: 14px; }
    .amount { font-family: monospace; text-align: right; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>📊 Reporte Diario HubSpot</h1>
  <p class="subtitle">${dateStr}</p>

  <div class="stats">
    <div class="stat-card blue">
      <div class="stat-value">${data.newLeads.length}</div>
      <div class="stat-label">Nuevos Leads</div>
    </div>
    <div class="stat-card green">
      <div class="stat-value">${data.closedWon.length}</div>
      <div class="stat-label">Cerrados Ganados</div>
    </div>
    <div class="stat-card red">
      <div class="stat-value">${data.closedLost.length}</div>
      <div class="stat-label">Cerrados Perdidos</div>
    </div>
    <div class="stat-card orange">
      <div class="stat-value">${data.followUpNeeded.length}</div>
      <div class="stat-label">Seguimiento Urgente</div>
    </div>
  </div>

  <h2>💰 Pipeline Actual</h2>
  <p><strong>Monto Total:</strong> ${formatCurrency(data.totalPipelineAmount)}</p>
  <p><strong>m² Total:</strong> ${formatM2(data.totalPipelineM2)}</p>

  <h2>📈 Análisis de Precios</h2>
  <div class="stats">
    <div class="stat-card green">
      <div class="stat-value">${data.priceStats.inRange}</div>
      <div class="stat-label">🟢 En Precio</div>
    </div>
    <div class="stat-card" style="border-left: 4px solid #eab308;">
      <div class="stat-value">${data.priceStats.belowMarket}</div>
      <div class="stat-label">🟡 Por Debajo</div>
    </div>
    <div class="stat-card red">
      <div class="stat-value">${data.priceStats.aboveMarket}</div>
      <div class="stat-label">🔴 Por Encima</div>
    </div>
  </div>

  ${data.newLeads.length > 0 ? `
  <h2>🎯 Nuevos Leads</h2>
  <table>
    <thead>
      <tr><th>Negocio</th><th>Cliente</th><th class="amount">Monto</th></tr>
    </thead>
    <tbody>
      ${data.newLeads.map(d => `
        <tr>
          <td>${d.properties.dealname}</td>
          <td>${d.clienteEmpresa || d.clienteNombre || '-'}</td>
          <td class="amount">${formatCurrency(parseFloat(d.properties.amount || '0'))}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  ${data.followUpNeeded.length > 0 ? `
  <h2>⚠️ Requieren Seguimiento</h2>
  <table>
    <thead>
      <tr><th>Negocio</th><th>Cliente</th><th>Días</th><th class="amount">Monto</th></tr>
    </thead>
    <tbody>
      ${data.followUpNeeded.slice(0, 10).map(d => `
        <tr>
          <td>${d.properties.dealname}</td>
          <td>${d.clienteEmpresa || d.clienteNombre || '-'}</td>
          <td>${d.daysSinceCreation}d</td>
          <td class="amount">${formatCurrency(parseFloat(d.properties.amount || '0'))}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  <div class="footer">
    Generado por FOMO Platform | ${new Date().toLocaleString('es-AR')}
  </div>
</body>
</html>
  `
}
