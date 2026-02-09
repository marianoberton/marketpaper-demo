/**
 * Sistema de Análisis de Precios m2
 * 
 * Compara precio cotizado vs precio de mercado por zona
 * y genera clasificación visual con semáforo
 */

// ---------------------
// Tipos
// ---------------------

export interface ZoneMarketPrice {
  zoneId: string
  zoneName: string
  minPriceM2: number
  maxPriceM2: number
  avgPriceM2: number
  lastUpdated: string
}

export interface PriceClassification {
  status: 'in_range' | 'below_market' | 'above_market'
  emoji: '🟢' | '🟡' | '🔴'
  label: string
  description: string
  percentDiff: number // Diferencia porcentual con el mercado
  marketAvg: number
  quotedPrice: number
}

export interface DealPriceAnalysis {
  dealId: string
  dealName: string
  clientName: string
  zone: string
  quotedPriceM2: number
  totalM2: number
  classification: PriceClassification
  createdAt: string
}

// ---------------------
// Precios de Mercado por Zona (Argentina - Cartón Corrugado)
// ---------------------

// Precios de referencia por zona/tipo de caja (en USD/m2)
// Estos valores deberían venir de una tabla en Supabase, pero los hardcodeamos como baseline
export const MARKET_PRICES: Record<string, ZoneMarketPrice> = {
  'amba': {
    zoneId: 'amba',
    zoneName: 'AMBA (Buenos Aires)',
    minPriceM2: 550,
    maxPriceM2: 750,
    avgPriceM2: 650,
    lastUpdated: new Date().toISOString(),
  },
  'interior': {
    zoneId: 'interior',
    zoneName: 'Interior del País',
    minPriceM2: 600,
    maxPriceM2: 850,
    avgPriceM2: 725,
    lastUpdated: new Date().toISOString(),
  },
  'exportacion': {
    zoneId: 'exportacion',
    zoneName: 'Exportación',
    minPriceM2: 500,
    maxPriceM2: 700,
    avgPriceM2: 600,
    lastUpdated: new Date().toISOString(),
  },
  'default': {
    zoneId: 'default',
    zoneName: 'General',
    minPriceM2: 550,
    maxPriceM2: 800,
    avgPriceM2: 675,
    lastUpdated: new Date().toISOString(),
  }
}

// Tolerancia para considerar "en rango" (±10%)
const TOLERANCE_PERCENT = 10

// ---------------------
// Funciones de Clasificación
// ---------------------

/**
 * Clasifica un precio cotizado vs el mercado
 */
export function classifyPrice(
  quotedPriceM2: number,
  zone: string = 'default'
): PriceClassification {
  if (quotedPriceM2 <= 0) {
    return {
      status: 'in_range',
      emoji: '🟢',
      label: 'Sin datos',
      description: 'No hay precio cotizado para analizar',
      percentDiff: 0,
      marketAvg: 0,
      quotedPrice: 0,
    }
  }

  const marketData = MARKET_PRICES[zone.toLowerCase()] || MARKET_PRICES['default']
  const { avgPriceM2, minPriceM2, maxPriceM2 } = marketData

  // Calcular diferencia porcentual con el promedio de mercado
  const percentDiff = ((quotedPriceM2 - avgPriceM2) / avgPriceM2) * 100

  // Determinar clasificación
  // Nota: Para el negocio de cartón corrugado, un precio BAJO es bueno para el comprador
  // pero malo para el vendedor. Ajustamos la lógica según el contexto de MarketPaper (vendedor)
  
  if (quotedPriceM2 >= minPriceM2 && quotedPriceM2 <= maxPriceM2) {
    // Dentro del rango de mercado
    return {
      status: 'in_range',
      emoji: '🟢',
      label: 'En precio',
      description: `Precio dentro del rango de mercado (${formatPriceARS(minPriceM2)} - ${formatPriceARS(maxPriceM2)}/m²)`,
      percentDiff: Math.round(percentDiff * 10) / 10,
      marketAvg: avgPriceM2,
      quotedPrice: quotedPriceM2,
    }
  } else if (quotedPriceM2 < minPriceM2) {
    // Por debajo del mercado (precio bajo - riesgoso para el vendedor)
    return {
      status: 'below_market',
      emoji: '🟡',
      label: 'Por debajo',
      description: `Precio ${Math.abs(Math.round(percentDiff))}% por debajo del promedio de mercado`,
      percentDiff: Math.round(percentDiff * 10) / 10,
      marketAvg: avgPriceM2,
      quotedPrice: quotedPriceM2,
    }
  } else {
    // Por encima del mercado (precio alto - difícil de cerrar)
    return {
      status: 'above_market',
      emoji: '🔴',
      label: 'Por encima',
      description: `Precio ${Math.round(percentDiff)}% por encima del promedio de mercado`,
      percentDiff: Math.round(percentDiff * 10) / 10,
      marketAvg: avgPriceM2,
      quotedPrice: quotedPriceM2,
    }
  }
}

/**
 * Obtiene la clasificación CSS para el indicador
 */
export function getPriceClassificationStyles(classification: PriceClassification) {
  switch (classification.status) {
    case 'in_range':
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800',
      }
    case 'below_market':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-400',
        border: 'border-yellow-200 dark:border-yellow-800',
      }
    case 'above_market':
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
      }
  }
}

/**
 * Detecta la zona basándose en el nombre del cliente/empresa
 */
export function detectZone(clientName: string, clientCompany: string): string {
  const text = `${clientName} ${clientCompany}`.toLowerCase()
  
  // Patrones para detectar zonas
  const patterns: Record<string, RegExp[]> = {
    'amba': [
      /buenos\s*aires/i,
      /capital/i,
      /caba/i,
      /gba/i,
      /zona\s*norte/i,
      /zona\s*sur/i,
      /zona\s*oeste/i,
    ],
    'interior': [
      /córdoba/i,
      /rosario/i,
      /mendoza/i,
      /tucumán/i,
      /interior/i,
      /santa\s*fe/i,
      /salta/i,
      /neuquén/i,
    ],
    'exportacion': [
      /export/i,
      /chile/i,
      /uruguay/i,
      /paraguay/i,
      /brasil/i,
      /bolivia/i,
      /internacional/i,
    ],
  }

  for (const [zone, regexList] of Object.entries(patterns)) {
    for (const regex of regexList) {
      if (regex.test(text)) {
        return zone
      }
    }
  }

  return 'default'
}

/**
 * Formatea precio en ARS
 */
function formatPriceARS(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Analiza un deal completo y retorna el análisis de precio
 */
export function analyzeDealPrice(deal: {
  id: string
  dealName: string
  clientName: string
  clientCompany: string
  precioPromedioM2: number
  m2Total: number
  createdAt: string
}): DealPriceAnalysis {
  const zone = detectZone(deal.clientName, deal.clientCompany)
  const classification = classifyPrice(deal.precioPromedioM2, zone)

  return {
    dealId: deal.id,
    dealName: deal.dealName,
    clientName: deal.clientCompany || deal.clientName,
    zone: MARKET_PRICES[zone]?.zoneName || 'General',
    quotedPriceM2: deal.precioPromedioM2,
    totalM2: deal.m2Total,
    classification,
    createdAt: deal.createdAt,
  }
}

// ---------------------
// Estadísticas de Clasificación
// ---------------------

export interface PriceAnalysisStats {
  total: number
  inRange: number
  belowMarket: number
  aboveMarket: number
  avgDiffPercent: number
  potentialRevenue: number // Ingresos si todos estuvieran en precio de mercado
}

export function calculatePriceStats(analyses: DealPriceAnalysis[]): PriceAnalysisStats {
  if (analyses.length === 0) {
    return {
      total: 0,
      inRange: 0,
      belowMarket: 0,
      aboveMarket: 0,
      avgDiffPercent: 0,
      potentialRevenue: 0,
    }
  }

  const stats = analyses.reduce(
    (acc, analysis) => {
      acc.total++
      if (analysis.classification.status === 'in_range') acc.inRange++
      else if (analysis.classification.status === 'below_market') acc.belowMarket++
      else acc.aboveMarket++

      acc.totalDiff += analysis.classification.percentDiff
      acc.potentialRevenue += analysis.classification.marketAvg * analysis.totalM2

      return acc
    },
    { total: 0, inRange: 0, belowMarket: 0, aboveMarket: 0, totalDiff: 0, potentialRevenue: 0 }
  )

  return {
    total: stats.total,
    inRange: stats.inRange,
    belowMarket: stats.belowMarket,
    aboveMarket: stats.aboveMarket,
    avgDiffPercent: Math.round((stats.totalDiff / stats.total) * 10) / 10,
    potentialRevenue: Math.round(stats.potentialRevenue),
  }
}
