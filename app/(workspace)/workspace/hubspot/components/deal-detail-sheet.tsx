'use client'

import { useEffect, useState } from 'react'
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
import { ExternalLink, Mail, Phone, Building2, User, FileText, Clock, Package, Loader2 } from 'lucide-react'
import { getDealLineItems, type EnrichedDeal, type HubSpotLineItem } from '@/actions/hubspot-analytics'

interface DealDetailSheetProps {
  companyId: string
  deal: EnrichedDeal | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DealDetailSheet({ companyId, deal, open, onOpenChange }: DealDetailSheetProps) {
  const [lineItems, setLineItems] = useState<HubSpotLineItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  useEffect(() => {
    if (open && deal && companyId) {
      setLoadingItems(true)
      getDealLineItems(companyId, deal.id)
        .then(setLineItems)
        .catch(console.error)
        .finally(() => setLoadingItems(false))
    } else {
      setLineItems([])
    }
  }, [open, deal, companyId])

  if (!deal) return null

  const amount = parseFloat(deal.properties.amount || '0') || 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        <div className="px-6 pt-6">
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
        </div>

        <div className="flex flex-col gap-6 px-6 py-6">
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

          {/* Line Items (Native) */}
          {loadingItems ? (
            <Section title="Items">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Cargando items...
              </div>
            </Section>
          ) : lineItems.length > 0 ? (
            <Section title={`Items (${lineItems.length})`}>
              <div className="space-y-2">
                {lineItems.map((item, i) => (
                  <div key={item.id} className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        {item.properties.mp_tipo_caja || item.properties.name || `Item ${i + 1}`}
                      </div>
                      <div className="font-semibold">{formatCurrency(parseFloat(item.properties.amount || '0'))}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground text-xs">
                      {item.properties.quantity && (
                        <span>Cant: {item.properties.quantity}</span>
                      )}
                      {item.properties.mp_metros_cuadrados_item && (
                        <span>m2: {item.properties.mp_metros_cuadrados_item}</span>
                      )}
                      {item.properties.mp_precio_m2_unitario && (
                        <span>$/m2: {formatCurrency(parseFloat(item.properties.mp_precio_m2_unitario))}</span>
                      )}
                      {item.properties.price && (
                        <span>Precio: {formatCurrency(parseFloat(item.properties.price))}</span>
                      )}
                      {(item.properties.mp_largo_mm || item.properties.mp_ancho_mm || item.properties.mp_alto_mm) && (
                        <span>
                          Medidas: {item.properties.mp_largo_mm || '-'}x{item.properties.mp_ancho_mm || '-'}x{item.properties.mp_alto_mm || '-'} mm
                        </span>
                      )}
                      {item.properties.hs_sku && (
                        <span>SKU: {item.properties.hs_sku}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          ) : (
            /* Fallback to JSON items if no native items found */
            deal.itemsJson && Array.isArray(deal.itemsJson) && deal.itemsJson.length > 0 && (
              <Section title="Items (JSON)">
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
            )
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

        {/* Bottom padding for scroll */}
        <div className="pb-6" />
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
