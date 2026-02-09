/**
 * Sistema de Planes de Acción con IA
 * 
 * Genera planes de seguimiento para deals usando GPT-4o-mini
 */

import { ChatOpenAI } from '@langchain/openai'

// ---------------------
// Tipos
// ---------------------

export interface ActionPlanInput {
  dealId: string
  dealName: string
  clientName: string
  clientCompany: string
  clientEmail: string | null
  clientPhone: string | null
  stageLabel: string
  amount: number
  m2Total: number
  precioM2: number
  daysSinceCreation: number
  condicionesPago: string | null
  notasRapidas: string | null
  priceClassification: {
    status: 'in_range' | 'below_market' | 'above_market'
    percentDiff: number
  }
}

export interface ActionStep {
  order: number
  action: string
  timing: string
  channel: 'email' | 'phone' | 'whatsapp' | 'meeting' | 'internal'
  priority: 'high' | 'medium' | 'low'
  template?: string
}

export interface ActionPlan {
  dealId: string
  summary: string
  urgency: 'urgent' | 'normal' | 'low'
  nextSteps: ActionStep[]
  suggestedApproach: string
  riskAssessment: string
  generatedAt: string
  expiresAt: string
}

// ---------------------
// Prompts
// ---------------------

const SYSTEM_PROMPT = `Eres un experto en ventas B2B especializado en la industria de empaques y cartón corrugado en Argentina.
Tu rol es analizar oportunidades de venta y generar planes de acción concretos y accionables para el equipo comercial.

Contexto del negocio:
- MarketPaper vende cajas de cartón corrugado personalizadas
- El ciclo de venta típico es de 2-4 semanas
- Los clientes son empresas que necesitan embalaje para sus productos
- Los precios se manejan por m² de cartón

Responde SOLO en formato JSON válido con la estructura especificada.`

function buildUserPrompt(input: ActionPlanInput): string {
  const priceContext = input.priceClassification.status === 'in_range'
    ? 'El precio cotizado está dentro del rango de mercado.'
    : input.priceClassification.status === 'below_market'
    ? `El precio cotizado está ${Math.abs(input.priceClassification.percentDiff)}% por debajo del mercado. Considerar ajuste de precio o negociación.`
    : `El precio cotizado está ${input.priceClassification.percentDiff}% por encima del mercado. Considerar descuento o justificación de valor.`

  return `Analiza esta oportunidad de venta y genera un plan de acción:

DEAL: ${input.dealName}
CLIENTE: ${input.clientCompany || input.clientName}
EMAIL: ${input.clientEmail || 'No disponible'}
TELÉFONO: ${input.clientPhone || 'No disponible'}
ETAPA ACTUAL: ${input.stageLabel}
MONTO: $${input.amount.toLocaleString('es-AR')}
M² TOTAL: ${input.m2Total.toLocaleString('es-AR')} m²
PRECIO/M²: $${input.precioM2.toLocaleString('es-AR')}
DÍAS EN PIPELINE: ${input.daysSinceCreation}
CONDICIONES DE PAGO: ${input.condicionesPago || 'No especificadas'}
NOTAS: ${input.notasRapidas || 'Sin notas'}

ANÁLISIS DE PRECIO: ${priceContext}

Genera un plan de acción en el siguiente formato JSON:
{
  "summary": "Resumen ejecutivo de 1-2 oraciones",
  "urgency": "urgent|normal|low",
  "nextSteps": [
    {
      "order": 1,
      "action": "Descripción concreta de la acción",
      "timing": "Hoy|Mañana|Esta semana|Próxima semana",
      "channel": "email|phone|whatsapp|meeting|internal",
      "priority": "high|medium|low",
      "template": "Sugerencia de mensaje si aplica"
    }
  ],
  "suggestedApproach": "Estrategia recomendada para este cliente",
  "riskAssessment": "Análisis de riesgos y cómo mitigarlos"
}

Considera:
- Si el deal tiene más de 14 días, priorizar seguimiento urgente
- Si el precio está fuera de mercado, sugerir ajustes
- Si hay poca información de contacto, sugerir obtenerla
- Máximo 4 pasos de acción
- Incluir al menos un paso con template de mensaje`
}

// ---------------------
// Generación de Plan
// ---------------------

export async function generateActionPlan(input: ActionPlanInput): Promise<ActionPlan> {
  try {
    const model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000,
    })

    const response = await model.invoke([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(input) },
    ])

    // Extraer el contenido JSON de la respuesta
    const content = typeof response.content === 'string' 
      ? response.content 
      : JSON.stringify(response.content)
    
    // Intentar parsear JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No se pudo extraer JSON de la respuesta')
    }

    const parsed = JSON.parse(jsonMatch[0])

    const now = new Date()
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 horas

    return {
      dealId: input.dealId,
      summary: parsed.summary || 'Plan de acción generado',
      urgency: validateUrgency(parsed.urgency),
      nextSteps: validateSteps(parsed.nextSteps || []),
      suggestedApproach: parsed.suggestedApproach || '',
      riskAssessment: parsed.riskAssessment || '',
      generatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }
  } catch (error) {
    console.error('Error generating action plan:', error)
    
    // Plan de fallback en caso de error
    return generateFallbackPlan(input)
  }
}

function validateUrgency(urgency: string): 'urgent' | 'normal' | 'low' {
  if (urgency === 'urgent' || urgency === 'normal' || urgency === 'low') {
    return urgency
  }
  return 'normal'
}

function validateSteps(steps: any[]): ActionStep[] {
  return steps.slice(0, 4).map((step, index) => ({
    order: step.order || index + 1,
    action: step.action || 'Seguimiento pendiente',
    timing: step.timing || 'Esta semana',
    channel: validateChannel(step.channel),
    priority: validatePriority(step.priority),
    template: step.template,
  }))
}

function validateChannel(channel: string): ActionStep['channel'] {
  const valid = ['email', 'phone', 'whatsapp', 'meeting', 'internal']
  return valid.includes(channel) ? channel as ActionStep['channel'] : 'email'
}

function validatePriority(priority: string): ActionStep['priority'] {
  if (priority === 'high' || priority === 'medium' || priority === 'low') {
    return priority
  }
  return 'medium'
}

function generateFallbackPlan(input: ActionPlanInput): ActionPlan {
  const isUrgent = input.daysSinceCreation > 14
  const now = new Date()

  return {
    dealId: input.dealId,
    summary: `Seguimiento requerido para ${input.dealName}`,
    urgency: isUrgent ? 'urgent' : 'normal',
    nextSteps: [
      {
        order: 1,
        action: isUrgent 
          ? 'Contactar al cliente inmediatamente para verificar estado'
          : 'Enviar seguimiento por email sobre la cotización',
        timing: isUrgent ? 'Hoy' : 'Esta semana',
        channel: 'email',
        priority: isUrgent ? 'high' : 'medium',
        template: `Hola ${input.clientName.split(' ')[0]}, quería hacer seguimiento sobre la cotización que enviamos. ¿Tienen alguna consulta?`,
      },
      {
        order: 2,
        action: 'Verificar si el precio está alineado con el mercado',
        timing: 'Esta semana',
        channel: 'internal',
        priority: 'medium',
      },
    ],
    suggestedApproach: 'Mantener comunicación proactiva y ofrecer valor agregado.',
    riskAssessment: isUrgent 
      ? 'Deal con más de 14 días sin avance. Riesgo de perder la oportunidad.'
      : 'Seguimiento estándar. Sin riesgos inmediatos identificados.',
    generatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

// ---------------------
// Utilidades de Display
// ---------------------

export function getUrgencyStyles(urgency: ActionPlan['urgency']) {
  switch (urgency) {
    case 'urgent':
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
        icon: '🚨',
      }
    case 'normal':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        icon: '📋',
      }
    case 'low':
      return {
        bg: 'bg-gray-100 dark:bg-gray-800/30',
        text: 'text-gray-700 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-700',
        icon: '📌',
      }
  }
}

export function getChannelIcon(channel: ActionStep['channel']): string {
  switch (channel) {
    case 'email': return '📧'
    case 'phone': return '📞'
    case 'whatsapp': return '💬'
    case 'meeting': return '🤝'
    case 'internal': return '🏢'
  }
}

export function getPriorityStyles(priority: ActionStep['priority']) {
  switch (priority) {
    case 'high':
      return { text: 'text-red-600 dark:text-red-400', label: 'Alta' }
    case 'medium':
      return { text: 'text-yellow-600 dark:text-yellow-400', label: 'Media' }
    case 'low':
      return { text: 'text-gray-500 dark:text-gray-400', label: 'Baja' }
  }
}
