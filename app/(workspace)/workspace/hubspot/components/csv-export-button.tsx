'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import type { EnrichedDeal } from '@/actions/hubspot-analytics'

interface CSVExportButtonProps {
  deals: EnrichedDeal[]
  filename?: string
}

export function CSVExportButton({ deals, filename = 'hubspot-export' }: CSVExportButtonProps) {
  const handleExport = () => {
    if (deals.length === 0) return

    const headers = [
      'Negocio', 'Cliente', 'Empresa', 'Email', 'Telefono',
      'Etapa', 'Monto', 'm2 Total', '$/m2', 'Subtotal', 'Total IVA',
      'Fecha Creacion', 'Fecha Cierre', 'Dias', 'Condiciones Pago',
      'Condiciones Entrega', 'Notas'
    ]

    const rows = deals.map(d => [
      d.properties.dealname,
      d.clienteNombre,
      d.clienteEmpresa,
      d.clienteEmail,
      d.clienteTelefono,
      d.stageLabel,
      d.properties.amount,
      d.m2Total,
      d.precioPromedioM2,
      d.subtotal,
      d.totalIva,
      d.properties.createdate ? new Date(d.properties.createdate).toLocaleDateString('es-AR') : '',
      d.properties.closedate ? new Date(d.properties.closedate).toLocaleDateString('es-AR') : '',
      d.daysSinceCreation,
      d.condicionesPago || '',
      d.condicionesEntrega || '',
      d.notasRapidas || '',
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
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={deals.length === 0}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Exportar CSV
    </Button>
  )
}
