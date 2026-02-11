'use server'

import { createAdminClient } from '@/utils/supabase/server'
import {
  classifyPrice,
  detectZone,
  analyzeDealPrice,
  calculatePriceStats,
  MARKET_PRICES,
  type DealPriceAnalysis,
  type PriceAnalysisStats,
  type ZoneMarketPrice,
} from '@/lib/hubspot/price-analysis'
import {
  generateActionPlan,
  type ActionPlan,
  type ActionPlanInput,
} from '@/lib/hubspot/ai-action-plan'
import { getDealsEnriched, type EnrichedDeal } from './hubspot-analytics'

// Re-export types
export type {
  DealPriceAnalysis,
  PriceAnalysisStats,
  ZoneMarketPrice,
  ActionPlan,
  ActionPlanInput,
}

// ---------------------
// Price Analysis Actions
// ---------------------

/**
 * Analiza los precios de todos los deals de un pipeline
 */
export async function analyzeDealsPrice(
  companyId: string,
  pipelineId: string,
  stageIds?: string[]
): Promise<{ analyses: DealPriceAnalysis[]; stats: PriceAnalysisStats }> {
  // Obtener deals enriquecidos
  const dealsResponse = await getDealsEnriched(companyId, pipelineId, stageIds)
  
  // Analizar cada deal
  const analyses = dealsResponse.results
    .filter(deal => deal.precioPromedioM2 > 0) // Solo deals con precio
    .map(deal => analyzeDealPrice({
      id: deal.id,
      dealName: deal.properties.dealname,
      clientName: deal.clienteNombre,
      clientCompany: deal.clienteEmpresa,
      precioPromedioM2: deal.precioPromedioM2,
      m2Total: deal.m2Total,
      createdAt: deal.createdAt,
    }))

  const stats = calculatePriceStats(analyses)

  return { analyses, stats }
}

/**
 * Analiza el precio de un deal específico
 */
export async function analyzeSingleDealPrice(
  deal: EnrichedDeal
): Promise<DealPriceAnalysis> {
  return analyzeDealPrice({
    id: deal.id,
    dealName: deal.properties.dealname,
    clientName: deal.clienteNombre,
    clientCompany: deal.clienteEmpresa,
    precioPromedioM2: deal.precioPromedioM2,
    m2Total: deal.m2Total,
    createdAt: deal.createdAt,
  })
}

/**
 * Obtiene los precios de mercado por zona
 */
export async function getMarketPrices(): Promise<ZoneMarketPrice[]> {
  return Object.values(MARKET_PRICES)
}

// ---------------------
// Action Plan Actions
// ---------------------

/**
 * Genera un plan de acción para un deal específico
 */
export async function generateDealActionPlan(
  deal: EnrichedDeal
): Promise<ActionPlan> {
  // Analizar precio primero
  const priceAnalysis = analyzeDealPrice({
    id: deal.id,
    dealName: deal.properties.dealname,
    clientName: deal.clienteNombre,
    clientCompany: deal.clienteEmpresa,
    precioPromedioM2: deal.precioPromedioM2,
    m2Total: deal.m2Total,
    createdAt: deal.createdAt,
  })

  // Preparar input para IA
  const input: ActionPlanInput = {
    dealId: deal.id,
    dealName: deal.properties.dealname,
    clientName: deal.clienteNombre,
    clientCompany: deal.clienteEmpresa,
    clientEmail: deal.clienteEmail || null,
    clientPhone: deal.clienteTelefono || null,
    stageLabel: deal.stageLabel,
    amount: parseFloat(deal.properties.amount || '0') || 0,
    m2Total: deal.m2Total,
    precioM2: deal.precioPromedioM2,
    daysSinceCreation: deal.daysSinceCreation,
    condicionesPago: deal.condicionesPago,
    notasRapidas: deal.notasRapidas,
    priceClassification: {
      status: priceAnalysis.classification.status,
      percentDiff: priceAnalysis.classification.percentDiff,
    },
  }

  const plan = await generateActionPlan(input)
  
  return plan
}

/**
 * Guarda un plan de acción en la base de datos
 */
export async function saveActionPlan(
  companyId: string,
  plan: ActionPlan
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  // Verificar si la tabla existe, si no, crear
  const { error } = await supabase
    .from('hubspot_action_plans')
    .upsert({
      company_id: companyId,
      deal_id: plan.dealId,
      summary: plan.summary,
      urgency: plan.urgency,
      next_steps: plan.nextSteps,
      suggested_approach: plan.suggestedApproach,
      risk_assessment: plan.riskAssessment,
      generated_at: plan.generatedAt,
      expires_at: plan.expiresAt,
    }, {
      onConflict: 'company_id,deal_id',
    })

  if (error) {
    console.error('Error saving action plan:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Obtiene el plan de acción guardado para un deal
 */
export async function getSavedActionPlan(
  companyId: string,
  dealId: string
): Promise<ActionPlan | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('hubspot_action_plans')
    .select('*')
    .eq('company_id', companyId)
    .eq('deal_id', dealId)
    .single()

  if (error || !data) {
    return null
  }

  // Verificar si el plan expiró
  if (new Date(data.expires_at) < new Date()) {
    return null
  }

  return {
    dealId: data.deal_id,
    summary: data.summary,
    urgency: data.urgency,
    nextSteps: data.next_steps,
    suggestedApproach: data.suggested_approach,
    riskAssessment: data.risk_assessment,
    generatedAt: data.generated_at,
    expiresAt: data.expires_at,
  }
}

// ---------------------
// Daily Report Actions
// ---------------------

export interface DailyReportData {
  date: string
  newLeads: EnrichedDeal[]
  closedWon: EnrichedDeal[]
  closedLost: EnrichedDeal[]
  followUpNeeded: EnrichedDeal[]
  totalPipelineAmount: number
  totalPipelineM2: number
  priceStats: PriceAnalysisStats
}

// Caché simple en memoria (se resetea al reiniciar el servidor)
const reportCache = new Map<string, { data: DailyReportData; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

/**
 * Genera datos para el reporte diario
 */
export async function getDailyReportData(
  companyId: string,
  pipelineId: string,
  date?: string
): Promise<DailyReportData> {
  try {
    console.log('[getDailyReportData] Starting for company:', companyId, 'pipeline:', pipelineId, 'date:', date)

    // Verificar caché
    const cacheKey = `${companyId}-${pipelineId}-${date || 'today'}`
    const cached = reportCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[getDailyReportData] Returning cached data (age:', Math.round((Date.now() - cached.timestamp) / 1000), 's)')
      return cached.data
    }

    // Parsear fecha en zona horaria local (evitar interpretar como UTC)
    const targetDate = date ? new Date(date + 'T00:00:00') : new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const dateRange = {
      from: startOfDay.toISOString(),
      to: endOfDay.toISOString(),
    }

    console.log('[getDailyReportData] Date range:', dateRange)

    // Obtener TODOS los deals del pipeline (paginando si es necesario)
    let allDeals: EnrichedDeal[] = []
    let after: string | undefined = undefined
    let hasMore = true
    let pageCount = 0

    while (hasMore) {
      pageCount++
      console.log('[getDailyReportData] Fetching page', pageCount, 'after:', after)

      // Agregar delay entre páginas para evitar rate limiting (excepto primera página)
      if (pageCount > 1) {
        console.log('[getDailyReportData] Waiting 1.5s to avoid rate limit...')
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      const dealsResponse = await getDealsEnriched(companyId, pipelineId, undefined, after)
      allDeals = [...allDeals, ...dealsResponse.results]

      console.log('[getDailyReportData] Page', pageCount, 'fetched:', dealsResponse.results.length, 'deals. Total so far:', allDeals.length)

      // Verificar si hay más páginas
      if (dealsResponse.paging?.next?.after) {
        after = dealsResponse.paging.next.after
      } else {
        hasMore = false
      }

      // Seguridad: limitar a 50 páginas máximo para evitar loops infinitos
      if (pageCount >= 50) {
        console.warn('[getDailyReportData] Reached max page limit (50)')
        hasMore = false
      }
    }

    console.log('[getDailyReportData] All deals fetched:', allDeals.length)

    // Filtrar por etapa y fecha
    const newLeads = allDeals.filter(d => {
      const createDate = new Date(d.properties.createdate || '')
      return createDate >= startOfDay && createDate <= endOfDay
    })

    const closedWon = allDeals.filter(d => {
      const stageLabel = d.stageLabel.toLowerCase()
      if (!stageLabel.includes('cierre ganado') && !stageLabel.includes('closedwon')) return false
      const closeDate = new Date(d.properties.closedate || d.createdAt)
      return closeDate >= startOfDay && closeDate <= endOfDay
    })

    const closedLost = allDeals.filter(d => {
      const stageLabel = d.stageLabel.toLowerCase()
      if (!stageLabel.includes('cierre perdido') && !stageLabel.includes('closedlost')) return false
      const closeDate = new Date(d.properties.closedate || d.createdAt)
      return closeDate >= startOfDay && closeDate <= endOfDay
    })

    const followUpNeeded = allDeals.filter(d => {
      const stageLabel = d.stageLabel.toLowerCase()
      return stageLabel.includes('+14') || d.daysSinceCreation > 14
    })

    // Calcular totales de pipeline abierto
    const openDeals = allDeals.filter(d => {
      const stageLabel = d.stageLabel.toLowerCase()
      return !stageLabel.includes('cierre ganado') &&
             !stageLabel.includes('cierre perdido') &&
             !stageLabel.includes('closedwon') &&
             !stageLabel.includes('closedlost')
    })

    const totalPipelineAmount = openDeals.reduce(
      (sum, d) => sum + (parseFloat(d.properties.amount || '0') || 0),
      0
    )
    const totalPipelineM2 = openDeals.reduce((sum, d) => sum + d.m2Total, 0)

    // Análisis de precios
    console.log('[getDailyReportData] Analyzing prices...')
    const { stats } = await analyzeDealsPrice(companyId, pipelineId)

    const result = {
      date: targetDate.toISOString().split('T')[0],
      newLeads,
      closedWon,
      closedLost,
      followUpNeeded,
      totalPipelineAmount,
      totalPipelineM2,
      priceStats: stats,
    }

    console.log('[getDailyReportData] Report complete:', {
      date: result.date,
      newLeads: result.newLeads.length,
      closedWon: result.closedWon.length,
      closedLost: result.closedLost.length,
      followUpNeeded: result.followUpNeeded.length,
      totalPipelineAmount: result.totalPipelineAmount,
      totalPipelineM2: result.totalPipelineM2,
    })

    // Guardar en caché
    reportCache.set(cacheKey, { data: result, timestamp: Date.now() })
    console.log('[getDailyReportData] Data cached for', CACHE_TTL / 1000, 'seconds')

    return result
  } catch (error) {
    console.error('[getDailyReportData] Error:', error)

    // Detectar error de rate limiting de HubSpot
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('429') || errorMessage.includes('RATE_LIMIT') || errorMessage.includes('ten_secondly_rolling')) {
      throw new Error('HubSpot está limitando las llamadas a la API. Por favor espera 10 segundos e intenta nuevamente.')
    }

    throw new Error(`Error al generar reporte diario: ${errorMessage}`)
  }
}
