// ---------------------
// Date Range Type
// ---------------------

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

export type DatePreset = 'last14' | 'last30' | 'last90' | 'thisMonth' | 'thisYear' | 'all'

// ---------------------
// Price Indicator
// ---------------------

export interface PriceIndicator {
  color: string
  bgColor: string
  label: string
}

export function getPriceIndicator(precioM2: number): PriceIndicator {
  if (precioM2 <= 0) return { color: 'text-muted-foreground', bgColor: 'bg-muted', label: 'N/A' }
  if (precioM2 <= 700) return { color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', label: 'Competitivo' }
  if (precioM2 <= 850) return { color: 'text-yellow-700 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Normal' }
  return { color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', label: 'Alto' }
}

// ---------------------
// Constants
// ---------------------

export const DEAL_CUSTOM_PROPERTIES = [
  'dealname', 'amount', 'dealstage', 'pipeline', 'createdate', 'closedate',
  'hs_object_id', 'hubspot_owner_id',
  'fomo_external_id',
  'motivo_de_no_compra',
  'mp_cliente_email', 'mp_cliente_empresa', 'mp_cliente_nombre', 'mp_cliente_telefono',
  'mp_condiciones_entrega', 'mp_condiciones_pago', 'mp_condiciones_validez',
  'mp_items_json',
  'mp_metros_cuadrados_totales',
  'mp_notas_rapidas',
  'mp_pdf_presupuesto_url',
  'mp_precio_promedio_m2',
  'mp_tiene_items_a_cotizar',
  'mp_total_iva', 'mp_total_subtotal',
] as const

// ---------------------
// Interfaces
// ---------------------

export interface HubSpotDeal {
  id: string
  properties: {
    dealname: string
    amount: string
    dealstage: string
    pipeline: string
    closedate: string
    createdate: string
    hs_object_id: string
    [key: string]: string | null | undefined
  }
  createdAt: string
  updatedAt: string
  archived?: boolean
}

export interface HubSpotLineItem {
  id: string
  properties: {
    name: string
    price: string
    quantity: string
    hs_sku: string
    amount: string
    [key: string]: string | null | undefined
  }
  createdAt: string
  updatedAt: string
  archived?: boolean
}

export interface EnrichedDeal extends HubSpotDeal {
  stageLabel: string
  daysSinceCreation: number
  m2Total: number
  precioPromedioM2: number
  subtotal: number
  totalIva: number
  clienteNombre: string
  clienteEmpresa: string
  clienteEmail: string
  clienteTelefono: string
  pdfPresupuestoUrl: string | null
  motivoNoCompra: string | null
  notasRapidas: string | null
  condicionesPago: string | null
  condicionesEntrega: string | null
  condicionesValidez: string | null
  itemsJson: unknown[] | null
  associatedCompanyName: string | null
}

export interface PipelineMetrics {
  totalAmount: number
  dealCount: number
  avgTicket: number
  wonAmount: number
  wonCount: number
}

export interface FullPipelineMetrics {
  totalDeals: number
  openDeals: number
  wonDeals: number
  lostDeals: number
  totalPipelineAmount: number
  wonAmount: number
  lostAmount: number
  avgTicketWon: number
  avgTicketOpen: number
  totalM2Pipeline: number
  totalM2Won: number
  totalM2Lost: number
  avgPricePerM2Won: number
  avgPricePerM2Open: number
  winRate: number
  lossRate: number
  stageBreakdown: StageMetric[]
}

export interface StageMetric {
  stageId: string
  stageLabel: string
  displayOrder: number
  dealCount: number
  totalAmount: number
  totalM2: number
  avgPricePerM2: number
}

export interface HubSpotPipeline {
  id: string
  label: string
}

export interface HubSpotStage {
  id: string
  label: string
  displayOrder?: number
}

export interface DealsResponse {
  results: HubSpotDeal[]
  paging?: {
    next?: {
      after: string
    }
  }
}

export interface EnrichedDealsResponse {
  results: EnrichedDeal[]
  paging?: {
    next?: {
      after: string
    }
  }
}

export interface SeguimientoData {
  urgente: EnrichedDeal[]   // +14 days
  normal: EnrichedDeal[]    // -14 days
  totalDeals: number
  totalM2: number
  totalAmount: number
}

export interface PedidosData {
  confirmados: EnrichedDeal[]
  cerradosGanados: EnrichedDeal[]
  totalOrders: number
  totalAmount: number
  totalM2: number
}

export interface ReportData {
  allDeals: EnrichedDeal[]
  monthlyData: { name: string; monto: number; m2: number; deals: number }[]
  topClients: { name: string; value: number; m2: number; deals: number }[]
  stageDistribution: { name: string; value: number; fill: string }[]
}

// ---------------------
// Items Report Types
// ---------------------

export interface ReportLineItem {
  dealId: string
  dealName: string
  createDate: string
  clienteName: string
  condicionesPago: string | null
  stageLabel: string
  cantidad: number
  largoMm: number
  anchoMm: number
  altoMm: number
  m2PorUnidad: number
  m2Totales: number
  calidad: string
  precioUnitario: number
  subtotalSinIva: number
}

export interface ItemsReportData {
  lineItems: ReportLineItem[]
  totalM2: number
  totalSubtotal: number
  totalDeals: number
}

// ---------------------
// Helpers
// ---------------------

export function parseNum(val: string | null | undefined): number {
  return parseFloat(val || '0') || 0
}

export function daysSince(dateStr: string | null | undefined): number {
  if (!dateStr) return 0
  const date = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

export function enrichDeal(
  rawDeal: any,
  stagesMap: Map<string, string>
): EnrichedDeal {
  const props = rawDeal.properties || {}
  let itemsJson: unknown[] | null = null
  if (props.mp_items_json) {
    try {
      const parsed = JSON.parse(props.mp_items_json)
      itemsJson = Array.isArray(parsed) ? parsed : null
    } catch {
      itemsJson = null
    }
  }

  return {
    id: rawDeal.id,
    properties: {
      dealname: props.dealname || '',
      amount: props.amount || '0',
      dealstage: props.dealstage || '',
      pipeline: props.pipeline || '',
      closedate: props.closedate || '',
      createdate: props.createdate || '',
      hs_object_id: props.hs_object_id || '',
      ...props
    },
    createdAt: rawDeal.createdAt instanceof Date ? rawDeal.createdAt.toISOString() : String(rawDeal.createdAt || ''),
    updatedAt: rawDeal.updatedAt instanceof Date ? rawDeal.updatedAt.toISOString() : String(rawDeal.updatedAt || ''),
    archived: rawDeal.archived,
    stageLabel: stagesMap.get(props.dealstage || '') || props.dealstage || '',
    daysSinceCreation: daysSince(props.createdate),
    m2Total: parseNum(props.mp_metros_cuadrados_totales),
    precioPromedioM2: parseNum(props.mp_precio_promedio_m2),
    subtotal: parseNum(props.mp_total_subtotal),
    totalIva: parseNum(props.mp_total_iva),
    clienteNombre: props.mp_cliente_nombre || '',
    clienteEmpresa: props.mp_cliente_empresa || '',
    clienteEmail: props.mp_cliente_email || '',
    clienteTelefono: props.mp_cliente_telefono || '',
    pdfPresupuestoUrl: props.mp_pdf_presupuesto_url || null,
    motivoNoCompra: props.motivo_de_no_compra || null,
    notasRapidas: props.mp_notas_rapidas || null,
    condicionesPago: props.mp_condiciones_pago || null,
    condicionesEntrega: props.mp_condiciones_entrega || null,
    condicionesValidez: props.mp_condiciones_validez || null,
    itemsJson,
    associatedCompanyName: rawDeal.associatedCompanyName || null,
  }
}

// Stage color mapping for charts
const STAGE_COLORS: Record<string, string> = {
  'contacto inicial': '#3b82f6',
  'envío de presupuesto': '#06b6d4',
  'envio de presupuesto': '#06b6d4',
  'seguimiento/negociación - 14': '#f59e0b',
  'seguimiento/negociacion - 14': '#f59e0b',
  'seguimiento/negociación -14': '#f59e0b',
  'seguimiento/negociacion -14': '#f59e0b',
  'seguimiento/negociación +14': '#f97316',
  'seguimiento/negociacion +14': '#f97316',
  'seguimiento/negociación + 14': '#f97316',
  'seguimiento/negociacion + 14': '#f97316',
  'confirmado/orden recibida': '#22c55e',
  'cierre ganado': '#10b981',
  'cierre perdido': '#ef4444',
}

export function getStageColor(stageLabel: string): string {
  const normalized = stageLabel.toLowerCase().trim()
  return STAGE_COLORS[normalized] || '#64748b'
}
