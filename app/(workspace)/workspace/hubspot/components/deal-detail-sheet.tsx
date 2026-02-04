'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StageBadge } from './stage-badge'
import { formatCurrency, formatM2, formatCurrencyPerM2 } from '@/lib/formatters'
import { ExternalLink, Mail, Phone, Building2, User, FileText, Clock, Package } from 'lucide-react'
import type { EnrichedDeal } from '@/actions/hubspot-analytics'

interface DealDetailSheetProps {
  deal: EnrichedDeal | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DealDetailSheet({ deal, open, onOpenChange }: DealDetailSheetProps) {
  if (!deal) return null

  const amount = parseFloat(deal.properties.amount || '0') || 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-lg">{deal.properties.dealname}</SheetTitle>
          <div className="flex items-center gap-2 mt-1">
            <StageBadge label={deal.stageLabel} />
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {deal.daysSinceCreation} dias
            </Badge>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-6 py-6">
          {/* Financial Summary */}
          <Section title="Resumen Financiero">
            <DataRow label="Monto" value={formatCurrency(amount)} bold />
            {deal.m2Total > 0 && (
              <DataRow label="m2 Totales" value={formatM2(deal.m2Total)} />
            )}
            {deal.precioPromedioM2 > 0 && (
              <DataRow label="Precio Promedio m2" value={formatCurrencyPerM2(deal.precioPromedioM2)} />
            )}
            {deal.subtotal > 0 && (
              <DataRow label="Subtotal" value={formatCurrency(deal.subtotal)} />
            )}
            {deal.totalIva > 0 && (
              <DataRow label="Total con IVA" value={formatCurrency(deal.totalIva)} />
            )}
          </Section>

          {/* Client Info */}
          {(deal.clienteNombre || deal.clienteEmpresa) && (
            <Section title="Datos del Cliente">
              {deal.clienteNombre && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{deal.clienteNombre}</span>
                </div>
              )}
              {deal.clienteEmpresa && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{deal.clienteEmpresa}</span>
                </div>
              )}
              {deal.clienteEmail && (
                <a
                  href={`mailto:${deal.clienteEmail}`}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {deal.clienteEmail}
                </a>
              )}
              {deal.clienteTelefono && (
                <a
                  href={`tel:${deal.clienteTelefono}`}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  {deal.clienteTelefono}
                </a>
              )}
            </Section>
          )}

          {/* Conditions */}
          {(deal.condicionesPago || deal.condicionesEntrega || deal.condicionesValidez) && (
            <Section title="Condiciones">
              {deal.condicionesPago && (
                <DataRow label="Pago" value={deal.condicionesPago} />
              )}
              {deal.condicionesEntrega && (
                <DataRow label="Entrega" value={deal.condicionesEntrega} />
              )}
              {deal.condicionesValidez && (
                <DataRow label="Validez" value={deal.condicionesValidez} />
              )}
            </Section>
          )}

          {/* Line Items */}
          {deal.itemsJson && Array.isArray(deal.itemsJson) && deal.itemsJson.length > 0 && (
            <Section title="Items">
              <div className="space-y-2">
                {deal.itemsJson.map((item: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                    <div className="flex items-center gap-2 font-medium">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      {item.mp_tipo_caja || item.name || `Item ${i + 1}`}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground text-xs">
                      {item.mp_metros_cuadrados_item && (
                        <span>m2: {item.mp_metros_cuadrados_item}</span>
                      )}
                      {item.mp_precio_m2_unitario && (
                        <span>$/m2: {item.mp_precio_m2_unitario}</span>
                      )}
                      {item.mp_largo_mm && (
                        <span>Largo: {item.mp_largo_mm}mm</span>
                      )}
                      {item.mp_ancho_mm && (
                        <span>Ancho: {item.mp_ancho_mm}mm</span>
                      )}
                      {item.mp_alto_mm && (
                        <span>Alto: {item.mp_alto_mm}mm</span>
                      )}
                      {item.quantity && (
                        <span>Cantidad: {item.quantity}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Notes */}
          {deal.notasRapidas && (
            <Section title="Notas">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{deal.notasRapidas}</p>
            </Section>
          )}

          {/* Lost reason */}
          {deal.motivoNoCompra && (
            <Section title="Motivo de No Compra">
              <p className="text-sm text-red-600 dark:text-red-400">{deal.motivoNoCompra}</p>
            </Section>
          )}

          {/* Dates */}
          <Section title="Fechas">
            <DataRow
              label="Creacion"
              value={deal.properties.createdate ? new Date(deal.properties.createdate).toLocaleDateString('es-AR') : '-'}
            />
            <DataRow
              label="Cierre"
              value={deal.properties.closedate ? new Date(deal.properties.closedate).toLocaleDateString('es-AR') : '-'}
            />
          </Section>

          {/* PDF Link */}
          {deal.pdfPresupuestoUrl && (
            <Button asChild variant="outline" className="gap-2">
              <a href={deal.pdfPresupuestoUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4" />
                Ver Presupuesto PDF
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  )
}

function DataRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? 'font-semibold' : ''}>{value}</span>
    </div>
  )
}
