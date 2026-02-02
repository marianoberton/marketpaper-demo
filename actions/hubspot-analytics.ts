'use server'

import { getHubSpotClient } from "@/lib/hubspot"

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

export interface PipelineMetrics {
  totalAmount: number
  dealCount: number
  avgTicket: number
  wonAmount: number,
  wonCount: number
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

// Cache valid for 5 minutes
export async function getHubSpotKPIs(companyId: string, pipelineId?: string): Promise<PipelineMetrics> {
  const hubspot = await getHubSpotClient(companyId)

  // 0. Determine Won/Lost Stage IDs for the specific pipeline
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

  // Common filters
  const pipelineFilter = pipelineId ? { propertyName: "pipeline", operator: "EQ" as any, value: pipelineId } : undefined

  // 1. Get Closed Won
  const wonFilters = [
      { propertyName: "dealstage", operator: "EQ" as any, value: wonStageId }
  ]
  if (pipelineFilter) wonFilters.push(pipelineFilter)

  const wonSearch = await hubspot.crm.deals.searchApi.doSearch({
    filterGroups: [{ filters: wonFilters }],
    properties: ["amount"],
    limit: 100 
  })

  // 2. Get Open Deals
  const openFilters = [
    { propertyName: "dealstage", operator: "NEQ" as any, value: wonStageId },
    { propertyName: "dealstage", operator: "NEQ" as any, value: lostStageId }
  ]
  if (pipelineFilter) openFilters.push(pipelineFilter)

  const openSearch = await hubspot.crm.deals.searchApi.doSearch({
    filterGroups: [{ filters: openFilters }],
    properties: ["amount"],
    limit: 100
  })

  // Calculate Metrics
  const wonDeals = wonSearch.results
  const wonAmount = wonDeals.reduce((sum, deal) => sum + (parseFloat(deal.properties.amount || '0') || 0), 0)
  
  const openDeals = openSearch.results
  const openAmount = openDeals.reduce((sum, deal) => sum + (parseFloat(deal.properties.amount || '0') || 0), 0)

  return {
    totalAmount: openAmount, // Active Pipeline Value
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
  
  const filters = []
  
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
    after // Pagination cursor
  })

  // Sanitize for Next.js Serialization (Date objects -> Strings)
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

// Alias for compatibility if needed, or deprecate
export const getRecentDeals = async (companyId: string, pipelineId?: string) => {
    const response = await getDeals(companyId, pipelineId)
    return response.results
}
