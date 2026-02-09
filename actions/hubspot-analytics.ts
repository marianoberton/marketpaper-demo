'use server'

import { getHubSpotClient } from "@/lib/hubspot"
import {
  DEAL_CUSTOM_PROPERTIES,
  enrichDeal,
  parseNum,
  type HubSpotDeal,
  type HubSpotPipeline,
  type HubSpotStage,
  type HubSpotLineItem,
  type PipelineMetrics,
  type FullPipelineMetrics,
  type StageMetric,
  type DealsResponse,
  type EnrichedDealsResponse,
  type EnrichedDeal,
  type SeguimientoData,
  type PedidosData,
  type ReportData,
  type DateRange,
  type ReportLineItem,
  type ItemsReportData,
} from "@/lib/hubspot-analytics-types"

// Re-export types for consumers
export type {
  HubSpotDeal,
  HubSpotPipeline,
  HubSpotStage,
  HubSpotLineItem,
  PipelineMetrics,
  FullPipelineMetrics,
  StageMetric,
  DealsResponse,
  EnrichedDealsResponse,
  EnrichedDeal,
  SeguimientoData,
  PedidosData,
  ReportData,
  DateRange,
  ReportLineItem,
  ItemsReportData,
}

// ---------------------
// Date Filter Helper
// ---------------------

function buildDateFilters(dateRange?: { from?: string; to?: string }): any[] {
  const filters: any[] = []
  if (dateRange?.from) {
    filters.push({
      propertyName: "createdate",
      operator: "GTE" as any,
      value: dateRange.from
    })
  }
  if (dateRange?.to) {
    filters.push({
      propertyName: "createdate",
      operator: "LTE" as any,
      value: dateRange.to
    })
  }
  return filters
}

// ---------------------
// Server Actions
// ---------------------

export async function getHubSpotPipelines(companyId: string): Promise<HubSpotPipeline[]> {
  const hubspot = await getHubSpotClient(companyId)
  const result = await hubspot.crm.pipelines.pipelinesApi.getAll('deals')
  return result.results.map(p => ({ id: p.id, label: p.label }))
}

export async function getHubSpotPipelineStages(companyId: string, pipelineId: string): Promise<HubSpotStage[]> {
  const hubspot = await getHubSpotClient(companyId)
  const result = await hubspot.crm.pipelines.pipelinesApi.getById('deals', pipelineId)
  return result.stages.map(s => ({
    id: s.id,
    label: s.label,
    displayOrder: s.displayOrder
  }))
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
}

export async function getHubSpotKPIs(companyId: string, pipelineId?: string): Promise<PipelineMetrics> {
  const hubspot = await getHubSpotClient(companyId)

  let wonStageId = 'closedwon'
  let lostStageId = 'closedlost'

  if (pipelineId) {
    try {
      const pipeline = await hubspot.crm.pipelines.pipelinesApi.getById('deals', pipelineId)
      const wonStage = pipeline.stages.find(s => s.metadata?.probability === '1.0')
      const lostStage = pipeline.stages.find(s => s.metadata?.probability === '0.0')
      if (wonStage) wonStageId = wonStage.id
      if (lostStage) lostStageId = lostStage.id
    } catch (e) {
      console.error("Error fetching pipeline metadata, falling back to defaults", e)
    }
  }

  const pipelineFilter = pipelineId ? { propertyName: "pipeline", operator: "EQ" as any, value: pipelineId } : undefined

  const wonFilters: any[] = [
    { propertyName: "dealstage", operator: "EQ" as any, value: wonStageId }
  ]
  if (pipelineFilter) wonFilters.push(pipelineFilter)

  const wonSearch = await hubspot.crm.deals.searchApi.doSearch({
    filterGroups: [{ filters: wonFilters }],
    properties: ["amount"],
    limit: 100
  })

  const openFilters: any[] = [
    { propertyName: "dealstage", operator: "NEQ" as any, value: wonStageId },
    { propertyName: "dealstage", operator: "NEQ" as any, value: lostStageId }
  ]
  if (pipelineFilter) openFilters.push(pipelineFilter)

  const openSearch = await hubspot.crm.deals.searchApi.doSearch({
    filterGroups: [{ filters: openFilters }],
    properties: ["amount"],
    limit: 100
  })

  const wonDeals = wonSearch.results
  const wonAmount = wonDeals.reduce((sum, deal) => sum + (parseFloat(deal.properties.amount || '0') || 0), 0)
  const openDeals = openSearch.results
  const openAmount = openDeals.reduce((sum, deal) => sum + (parseFloat(deal.properties.amount || '0') || 0), 0)

  return {
    totalAmount: openAmount,
    dealCount: openDeals.length,
    avgTicket: wonDeals.length > 0 ? wonAmount / wonDeals.length : 0,
    wonAmount,
    wonCount: wonDeals.length
  }
}

export async function getDeals(
  companyId: string,
  pipelineId?: string,
  stageIds?: string[],
  after?: string
): Promise<DealsResponse> {
  const hubspot = await getHubSpotClient(companyId)

  const filters: any[] = []
  if (pipelineId) {
    filters.push({ propertyName: "pipeline", operator: "EQ" as any, value: pipelineId })
  }
  if (stageIds && stageIds.length > 0 && !stageIds.includes('all')) {
    filters.push({ propertyName: "dealstage", operator: "IN" as any, values: stageIds })
  }

  const result = await hubspot.crm.deals.searchApi.doSearch({
    filterGroups: filters.length > 0 ? [{ filters }] : [],
    sorts: ["-createdate"],
    properties: ["dealname", "amount", "dealstage", "pipeline", "createdate", "closedate"],
    limit: 10,
    after
  })

  const sanitizedDeals = result.results.map(deal => ({
    id: deal.id,
    properties: {
      dealname: deal.properties.dealname || '',
      amount: deal.properties.amount || '0',
      dealstage: deal.properties.dealstage || '',
      pipeline: deal.properties.pipeline || '',
      closedate: deal.properties.closedate || '',
      createdate: deal.properties.createdate || '',
      hs_object_id: deal.properties.hs_object_id || '',
      ...deal.properties
    },
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString(),
    archived: deal.archived
  }))

  return {
    results: sanitizedDeals,
    paging: result.paging ? {
      next: result.paging.next ? {
        after: result.paging.next.after
      } : undefined
    } : undefined
  }
}

export async function getRecentDeals(companyId: string, pipelineId?: string) {
  const response = await getDeals(companyId, pipelineId)
  return response.results
}

// ---------------------
// Internal Helpers (not exported)
// ---------------------

async function fetchAllDeals(
  companyId: string,
  pipelineId: string,
  stagesMap: Map<string, string>,
  stageIds?: string[],
  dateRange?: { from?: string; to?: string }
): Promise<EnrichedDeal[]> {
  const hubspot = await getHubSpotClient(companyId)
  const allDeals: EnrichedDeal[] = []
  let after: string | undefined = undefined

  const filters: any[] = [
    { propertyName: "pipeline", operator: "EQ" as any, value: pipelineId }
  ]
  if (stageIds && stageIds.length > 0) {
    filters.push({ propertyName: "dealstage", operator: "IN" as any, values: stageIds })
  }
  // Add date filters
  filters.push(...buildDateFilters(dateRange))

  do {
    const searchRequest: any = {
      filterGroups: [{ filters }],
      properties: [...DEAL_CUSTOM_PROPERTIES],
      limit: 100,
      sorts: ["-createdate"],
    }
    if (after) {
      searchRequest.after = after
    }

    const result = await hubspot.crm.deals.searchApi.doSearch(searchRequest)

    const enriched = result.results.map(deal => enrichDeal(deal, stagesMap))
    allDeals.push(...enriched)

    after = result.paging?.next?.after
  } while (after)

  return allDeals
}

async function buildStagesMap(companyId: string, pipelineId: string): Promise<{ map: Map<string, string>, stages: HubSpotStage[] }> {
  const stages = await getHubSpotPipelineStages(companyId, pipelineId)
  const map = new Map<string, string>()
  for (const s of stages) {
    map.set(s.id, s.label)
  }
  return { map, stages }
}

// ---------------------
// New Server Actions
// ---------------------

export async function getFullPipelineMetrics(
  companyId: string,
  pipelineId: string,
  dateRange?: { from?: string; to?: string }
): Promise<FullPipelineMetrics> {
  const { map: stagesMap, stages } = await buildStagesMap(companyId, pipelineId)
  const allDeals = await fetchAllDeals(companyId, pipelineId, stagesMap, undefined, dateRange)

  // Identify won/lost stages by label patterns
  const wonStageIds = new Set<string>()
  const lostStageIds = new Set<string>()
  for (const s of stages) {
    const label = s.label.toLowerCase()
    if (label.includes('cierre ganado') || label.includes('closedwon')) {
      wonStageIds.add(s.id)
    }
    if (label.includes('cierre perdido') || label.includes('closedlost')) {
      lostStageIds.add(s.id)
    }
  }

  // Categorize deals
  const wonDeals = allDeals.filter(d => wonStageIds.has(d.properties.dealstage))
  const lostDeals = allDeals.filter(d => lostStageIds.has(d.properties.dealstage))
  const openDeals = allDeals.filter(d => !wonStageIds.has(d.properties.dealstage) && !lostStageIds.has(d.properties.dealstage))

  const wonAmount = wonDeals.reduce((s, d) => s + parseNum(d.properties.amount), 0)
  const lostAmount = lostDeals.reduce((s, d) => s + parseNum(d.properties.amount), 0)
  const openAmount = openDeals.reduce((s, d) => s + parseNum(d.properties.amount), 0)

  const wonM2 = wonDeals.reduce((s, d) => s + d.m2Total, 0)
  const lostM2 = lostDeals.reduce((s, d) => s + d.m2Total, 0)
  const openM2 = openDeals.reduce((s, d) => s + d.m2Total, 0)

  const totalDecided = wonDeals.length + lostDeals.length

  // Per-stage breakdown
  const stageBreakdown: StageMetric[] = stages.map(stage => {
    const stageDeals = allDeals.filter(d => d.properties.dealstage === stage.id)
    const totalAmount = stageDeals.reduce((s, d) => s + parseNum(d.properties.amount), 0)
    const totalM2 = stageDeals.reduce((s, d) => s + d.m2Total, 0)
    return {
      stageId: stage.id,
      stageLabel: stage.label,
      displayOrder: stage.displayOrder || 0,
      dealCount: stageDeals.length,
      totalAmount,
      totalM2,
      avgPricePerM2: totalM2 > 0 ? totalAmount / totalM2 : 0,
    }
  }).sort((a, b) => a.displayOrder - b.displayOrder)

  return {
    totalDeals: allDeals.length,
    openDeals: openDeals.length,
    wonDeals: wonDeals.length,
    lostDeals: lostDeals.length,
    totalPipelineAmount: openAmount,
    wonAmount,
    lostAmount,
    avgTicketWon: wonDeals.length > 0 ? wonAmount / wonDeals.length : 0,
    avgTicketOpen: openDeals.length > 0 ? openAmount / openDeals.length : 0,
    totalM2Pipeline: openM2,
    totalM2Won: wonM2,
    totalM2Lost: lostM2,
    avgPricePerM2Won: wonM2 > 0 ? wonAmount / wonM2 : 0,
    avgPricePerM2Open: openM2 > 0 ? openAmount / openM2 : 0,
    winRate: totalDecided > 0 ? (wonDeals.length / totalDecided) * 100 : 0,
    lossRate: totalDecided > 0 ? (lostDeals.length / totalDecided) * 100 : 0,
    stageBreakdown,
  }
}

export async function getDealsEnriched(
  companyId: string,
  pipelineId: string,
  stageIds?: string[],
  after?: string,
  dateRange?: { from?: string; to?: string }
): Promise<EnrichedDealsResponse> {
  const hubspot = await getHubSpotClient(companyId)
  const { map: stagesMap } = await buildStagesMap(companyId, pipelineId)

  const filters: any[] = [
    { propertyName: "pipeline", operator: "EQ" as any, value: pipelineId }
  ]
  if (stageIds && stageIds.length > 0 && !stageIds.includes('all')) {
    filters.push({ propertyName: "dealstage", operator: "IN" as any, values: stageIds })
  }

  // Add date filters for closedate
  if (dateRange?.from) {
    filters.push({
      propertyName: "closedate",
      operator: "GTE" as any,
      value: dateRange.from
    })
  }
  if (dateRange?.to) {
    filters.push({
      propertyName: "closedate",
      operator: "LTE" as any,
      value: dateRange.to
    })
  }

  const searchRequest: any = {
    filterGroups: [{ filters }],
    sorts: ["-createdate"],
    properties: [...DEAL_CUSTOM_PROPERTIES],
    limit: 20,
  }
  if (after) {
    searchRequest.after = after
  }

  const result = await hubspot.crm.deals.searchApi.doSearch(searchRequest)

  // Obtener companies asociadas para cada deal
  const dealsWithCompanies = await Promise.all(
    result.results.map(async (deal) => {
      try {
        // Obtener deal con asociaciones de companies
        const dealWithAssoc = await hubspot.crm.deals.basicApi.getById(
          deal.id,
          undefined,
          undefined,
          ['companies']
        )

        // @ts-ignore - HubSpot returns association keys with spaces
        const companyAssociations = dealWithAssoc.associations?.companies?.results

        if (companyAssociations && companyAssociations.length > 0) {
          // Obtener el nombre de la primera company asociada
          const companyId = companyAssociations[0].id
          try {
            const company = await hubspot.crm.companies.basicApi.getById(companyId, ['name'])
            return {
              ...deal,
              associatedCompanyName: company.properties.name || null
            }
          } catch (e) {
            console.error(`Error fetching company ${companyId}:`, e)
            return { ...deal, associatedCompanyName: null }
          }
        }
        return { ...deal, associatedCompanyName: null }
      } catch (e) {
        console.error(`Error fetching associations for deal ${deal.id}:`, e)
        return { ...deal, associatedCompanyName: null }
      }
    })
  )

  const enriched = dealsWithCompanies.map(deal => enrichDeal(deal, stagesMap))

  return {
    results: enriched,
    paging: result.paging ? {
      next: result.paging.next ? {
        after: result.paging.next.after
      } : undefined
    } : undefined
  }
}

export async function getSeguimientoDeals(
  companyId: string,
  pipelineId: string,
  dateRange?: { from?: string; to?: string }
): Promise<SeguimientoData> {
  const { map: stagesMap, stages } = await buildStagesMap(companyId, pipelineId)

  // Find seguimiento stage IDs by label pattern
  const seguimientoStageIds = stages
    .filter(s => s.label.toLowerCase().includes('seguimiento') || s.label.toLowerCase().includes('negociaci'))
    .map(s => s.id)

  if (seguimientoStageIds.length === 0) {
    return { urgente: [], normal: [], totalDeals: 0, totalM2: 0, totalAmount: 0 }
  }

  const allDeals = await fetchAllDeals(companyId, pipelineId, stagesMap, seguimientoStageIds, dateRange)

  // Find the +14 stage ID specifically
  const plus14StageId = stages.find(s => {
    const label = s.label.toLowerCase()
    return (label.includes('seguimiento') || label.includes('negociaci')) && label.includes('+14')
  })?.id

  // Split into urgente (+14) and normal (-14)
  const urgente = allDeals
    .filter(d => d.properties.dealstage === plus14StageId)
    .sort((a, b) => b.daysSinceCreation - a.daysSinceCreation)

  const normal = allDeals
    .filter(d => d.properties.dealstage !== plus14StageId)
    .sort((a, b) => b.daysSinceCreation - a.daysSinceCreation)

  const totalM2 = allDeals.reduce((s, d) => s + d.m2Total, 0)
  const totalAmount = allDeals.reduce((s, d) => s + parseNum(d.properties.amount), 0)

  return {
    urgente,
    normal,
    totalDeals: allDeals.length,
    totalM2,
    totalAmount,
  }
}

export async function getPedidosDeals(
  companyId: string,
  pipelineId: string,
  dateRange?: { from?: string; to?: string }
): Promise<PedidosData> {
  const { map: stagesMap, stages } = await buildStagesMap(companyId, pipelineId)

  const confirmadoStageId = stages.find(s =>
    s.label.toLowerCase().includes('confirmado') || s.label.toLowerCase().includes('orden recibida')
  )?.id

  const ganadoStageId = stages.find(s =>
    s.label.toLowerCase().includes('cierre ganado') || s.label.toLowerCase().includes('closedwon')
  )?.id

  const targetStageIds = [confirmadoStageId, ganadoStageId].filter(Boolean) as string[]

  if (targetStageIds.length === 0) {
    return { confirmados: [], cerradosGanados: [], totalOrders: 0, totalAmount: 0, totalM2: 0 }
  }

  const allDeals = await fetchAllDeals(companyId, pipelineId, stagesMap, targetStageIds, dateRange)

  const confirmados = allDeals
    .filter(d => d.properties.dealstage === confirmadoStageId)
    .sort((a, b) => b.daysSinceCreation - a.daysSinceCreation)

  const cerradosGanados = allDeals
    .filter(d => d.properties.dealstage === ganadoStageId)
    .sort((a, b) => b.daysSinceCreation - a.daysSinceCreation)

  const totalAmount = allDeals.reduce((s, d) => s + parseNum(d.properties.amount), 0)
  const totalM2 = allDeals.reduce((s, d) => s + d.m2Total, 0)

  return {
    confirmados,
    cerradosGanados,
    totalOrders: allDeals.length,
    totalAmount,
    totalM2,
  }
}

export async function getReportData(
  companyId: string,
  pipelineId: string,
  dateRange?: { from?: string; to?: string }
): Promise<ReportData> {
  const { map: stagesMap, stages } = await buildStagesMap(companyId, pipelineId)
  const allDeals = await fetchAllDeals(companyId, pipelineId, stagesMap, undefined, dateRange)

  // Monthly aggregation (last 12 months)
  const monthlyMap = new Map<string, { monto: number; m2: number; deals: number }>()
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyMap.set(key, { monto: 0, m2: 0, deals: 0 })
  }

  for (const deal of allDeals) {
    if (deal.properties.createdate) {
      const date = new Date(deal.properties.createdate)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const entry = monthlyMap.get(key)
      if (entry) {
        entry.monto += parseNum(deal.properties.amount)
        entry.m2 += deal.m2Total
        entry.deals += 1
      }
    }
  }

  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const monthlyData = Array.from(monthlyMap.entries()).map(([key, val]) => {
    const [, month] = key.split('-')
    return {
      name: monthNames[parseInt(month) - 1],
      monto: val.monto,
      m2: val.m2,
      deals: val.deals,
    }
  })

  // Top clients by amount
  const clientMap = new Map<string, { value: number; m2: number; deals: number }>()
  for (const deal of allDeals) {
    const clientName = deal.clienteEmpresa || deal.clienteNombre || 'Sin cliente'
    const entry = clientMap.get(clientName) || { value: 0, m2: 0, deals: 0 }
    entry.value += parseNum(deal.properties.amount)
    entry.m2 += deal.m2Total
    entry.deals += 1
    clientMap.set(clientName, entry)
  }
  const topClients = Array.from(clientMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  // Stage distribution for pie chart
  const wonStageIds = new Set(stages.filter(s => s.label.toLowerCase().includes('cierre ganado')).map(s => s.id))
  const lostStageIds = new Set(stages.filter(s => s.label.toLowerCase().includes('cierre perdido')).map(s => s.id))

  const wonCount = allDeals.filter(d => wonStageIds.has(d.properties.dealstage)).length
  const lostCount = allDeals.filter(d => lostStageIds.has(d.properties.dealstage)).length
  const openCount = allDeals.length - wonCount - lostCount

  const total = allDeals.length || 1
  const stageDistribution = [
    { name: 'Ganados', value: Math.round((wonCount / total) * 100), fill: '#10b981' },
    { name: 'Perdidos', value: Math.round((lostCount / total) * 100), fill: '#ef4444' },
    { name: 'En proceso', value: Math.round((openCount / total) * 100), fill: '#3b82f6' },
  ]

  return {
    allDeals,
    monthlyData,
    topClients,
    stageDistribution,
  }
}

// Helper: extract ReportLineItem from a raw item object (works for both itemsJson and native line items)
function itemToReportLine(
  deal: EnrichedDeal,
  item: Record<string, any>
): ReportLineItem {
  const cantidad = parseNum(item.quantity)
  const m2PorUnidad = parseNum(item.mp_metros_cuadrados_item)
  const precioM2Unitario = parseNum(item.mp_precio_m2_unitario)
  const m2Totales = cantidad * m2PorUnidad
  const precioUnitario = precioM2Unitario * m2PorUnidad
  const subtotalSinIva = cantidad * precioUnitario

  return {
    dealId: deal.id,
    dealName: deal.properties.dealname,
    createDate: deal.properties.createdate || '',
    clienteName: deal.clienteEmpresa || deal.clienteNombre || 'Sin cliente',
    condicionesPago: deal.condicionesPago,
    stageLabel: deal.stageLabel,
    cantidad,
    largoMm: parseNum(item.mp_largo_mm),
    anchoMm: parseNum(item.mp_ancho_mm),
    altoMm: parseNum(item.mp_alto_mm),
    m2PorUnidad,
    m2Totales,
    calidad: item.mp_tipo_caja || '-',
    precioUnitario,
    subtotalSinIva,
  }
}

export async function getItemsReport(
  companyId: string,
  pipelineId: string,
  dateRange?: { from?: string; to?: string }
): Promise<ItemsReportData> {
  const { map: stagesMap, stages } = await buildStagesMap(companyId, pipelineId)

  const confirmadoStageId = stages.find(s =>
    s.label.toLowerCase().includes('confirmado') || s.label.toLowerCase().includes('orden recibida')
  )?.id

  const ganadoStageId = stages.find(s =>
    s.label.toLowerCase().includes('cierre ganado') || s.label.toLowerCase().includes('closedwon')
  )?.id

  const targetStageIds = [confirmadoStageId, ganadoStageId].filter(Boolean) as string[]

  if (targetStageIds.length === 0) {
    return { lineItems: [], totalM2: 0, totalSubtotal: 0, totalDeals: 0 }
  }

  const allDeals = await fetchAllDeals(companyId, pipelineId, stagesMap, targetStageIds, dateRange)

  const lineItems: ReportLineItem[] = []

  for (const deal of allDeals) {
    try {
      const nativeItems = await getDealLineItems(companyId, deal.id)
      for (const nativeItem of nativeItems) {
        lineItems.push(itemToReportLine(deal, nativeItem.properties))
      }
    } catch (err) {
      console.error('[getItemsReport] Error fetching line items for deal', deal.id, err)
    }
  }

  const totalM2 = lineItems.reduce((s, li) => s + li.m2Totales, 0)
  const totalSubtotal = lineItems.reduce((s, li) => s + li.subtotalSinIva, 0)

  return {
    lineItems,
    totalM2,
    totalSubtotal,
    totalDeals: allDeals.length,
  }
}

export async function getDealLineItems(companyId: string, dealId: string): Promise<HubSpotLineItem[]> {
  const hubspot = await getHubSpotClient(companyId)

  try {
    // 1. Get Deal with Line Item associations
    // We request 'line_items' association. 
    // Note: The actual association type name might vary but 'line_items' is standard for v3.
    const deal = await hubspot.crm.deals.basicApi.getById(dealId, undefined, undefined, ['line_items'])

    // @ts-ignore - HubSpot returns association keys with spaces (e.g. 'line items')
    const lineItemAssociations = deal.associations?.['line items']?.results

    if (!lineItemAssociations || lineItemAssociations.length === 0) {
      return []
    }

    const lineItemIds = lineItemAssociations.map((a: any) => a.id)

    // 2. Batch read line items (basic + MarketPaper custom properties)
    const properties = [
      'name', 'price', 'quantity', 'amount', 'hs_sku', 'description',
      'mp_tipo_caja', 'mp_metros_cuadrados_item', 'mp_precio_m2_unitario',
      'mp_largo_mm', 'mp_ancho_mm', 'mp_alto_mm',
    ]

    const lineItemsResult = await hubspot.crm.lineItems.batchApi.read({
      inputs: lineItemIds.map(id => ({ id })),
      properties,
      propertiesWithHistory: [],
    })

    return lineItemsResult.results.map(item => ({
      id: item.id,
      properties: {
        name: item.properties.name || '',
        price: item.properties.price || '0',
        quantity: item.properties.quantity || '0',
        hs_sku: item.properties.hs_sku || '',
        amount: item.properties.amount || '0',
        description: item.properties.description,
        ...item.properties
      },
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      archived: item.archived
    }))
  } catch (e) {
    console.error('Error fetching deal line items:', e)
    return []
  }
}
