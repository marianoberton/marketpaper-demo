'use client'

import { useState } from 'react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatM2 } from '@/lib/formatters'
import { Search, Download } from 'lucide-react'
import type { ItemsReportData } from '@/actions/hubspot-analytics'

interface ItemsReportTableProps {
  data: ItemsReportData
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function formatDateDdMmm(isoStr: string): string {
  if (!isoStr) return '-'
  const date = new Date(isoStr)
  return `${date.getDate().toString().padStart(2, '0')}-${MONTH_NAMES[date.getMonth()]}`
}

export function ItemsReportTable({ data }: ItemsReportTableProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredItems = searchQuery
    ? data.lineItems.filter(li =>
      li.dealName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      li.clienteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      li.calidad.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : data.lineItems

  const filteredTotalM2 = filteredItems.reduce((s, li) => s + li.m2Totales, 0)
  const filteredTotalSubtotal = filteredItems.reduce((s, li) => s + li.subtotalSinIva, 0)

  const handleExportCSV = () => {
    if (filteredItems.length === 0) return

    const headers = [
      'Fecha Ingreso', 'Negocio', 'Cliente/Origen', 'Cantidad',
      'Largo (mm)', 'Ancho (mm)', 'Alto (mm)',
      'm2/Unidad', 'm2 Totales', 'Calidad',
      'Precio Unitario', 'Subtotal SIN IVA', 'Estado Pago'
    ]

    const rows = filteredItems.map(li => [
      formatDateDdMmm(li.createDate),
      li.dealName,
      li.clienteName,
      li.cantidad,
      li.largoMm || '',
      li.anchoMm || '',
      li.altoMm || '',
      li.m2PorUnidad,
      li.m2Totales,
      li.calidad,
      li.precioUnitario,
      li.subtotalSinIva,
      li.condicionesPago || '',
    ])

    rows.push([
      '', '', 'TOTALES', '', '', '', '', '',
      filteredTotalM2, '', '', filteredTotalSubtotal, ''
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
    link.download = `hubspot-items-report_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30 border-b py-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Detalle por Items</CardTitle>
          <CardDescription>
            {filteredItems.length} items de {data.totalDeals} pedidos
          </CardDescription>
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
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left font-medium text-muted-foreground">
            <tr>
              <th className="p-3 pl-4 whitespace-nowrap">Fecha</th>
              <th className="p-3">Negocio</th>
              <th className="p-3">Cliente</th>
              <th className="p-3 text-right">Cant.</th>
              <th className="p-3 text-right">Largo</th>
              <th className="p-3 text-right">Ancho</th>
              <th className="p-3 text-right">Alto</th>
              <th className="p-3 text-right whitespace-nowrap">m2/u</th>
              <th className="p-3 text-right whitespace-nowrap">m2 Total</th>
              <th className="p-3">Calidad</th>
              <th className="p-3 text-right whitespace-nowrap">P. Unit.</th>
              <th className="p-3 text-right">Subtotal</th>
              <th className="p-3">Pago</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={13} className="p-12 text-center text-muted-foreground">
                  No se encontraron items.
                </td>
              </tr>
            ) : (
              <>
                {filteredItems.map((li, idx) => (
                  <tr key={`${li.dealId}-${idx}`} className="hover:bg-muted/50 transition-colors">
                    <td className="p-3 pl-4 text-muted-foreground whitespace-nowrap">
                      {formatDateDdMmm(li.createDate)}
                    </td>
                    <td className="p-3 font-medium max-w-[180px] truncate" title={li.dealName}>
                      {li.dealName}
                    </td>
                    <td className="p-3 max-w-[150px] truncate" title={li.clienteName}>
                      {li.clienteName}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {li.cantidad.toLocaleString('es-AR')}
                    </td>
                    <td className="p-3 text-right font-mono text-muted-foreground">
                      {li.largoMm > 0 ? li.largoMm : '-'}
                    </td>
                    <td className="p-3 text-right font-mono text-muted-foreground">
                      {li.anchoMm > 0 ? li.anchoMm : '-'}
                    </td>
                    <td className="p-3 text-right font-mono text-muted-foreground">
                      {li.altoMm > 0 ? li.altoMm : '-'}
                    </td>
                    <td className="p-3 text-right font-mono text-muted-foreground">
                      {li.m2PorUnidad > 0 ? li.m2PorUnidad.toFixed(4) : '-'}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {li.m2Totales > 0 ? li.m2Totales.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="p-3 text-xs" title={li.calidad}>
                      {li.calidad}
                    </td>
                    <td className="p-3 text-right font-mono text-muted-foreground">
                      {formatCurrency(li.precioUnitario)}
                    </td>
                    <td className="p-3 text-right font-mono font-medium">
                      {formatCurrency(li.subtotalSinIva)}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground max-w-[140px] truncate" title={li.condicionesPago || ''}>
                      {li.condicionesPago || '-'}
                    </td>
                  </tr>
                ))}
                {/* Totals Row */}
                <tr className="bg-muted/50 font-semibold border-t-2 border-border">
                  <td colSpan={8} className="p-3 pl-4 text-right text-muted-foreground uppercase text-xs tracking-wider">
                    Totales
                  </td>
                  <td className="p-3 text-right font-mono">
                    {formatM2(filteredTotalM2)}
                  </td>
                  <td className="p-3" />
                  <td className="p-3" />
                  <td className="p-3 text-right font-mono">
                    {formatCurrency(filteredTotalSubtotal)}
                  </td>
                  <td className="p-3" />
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
