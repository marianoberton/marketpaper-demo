// =============================================
// FOMO CRM - Channel Processors
// Sistema de procesadores para diferentes canales de leads
// =============================================

import { createClient } from '@/utils/supabase/server'

// =============================================
// TIPOS E INTERFACES
// =============================================

export type LeadChannel = 
  | 'web_form' | 'facebook_ads' | 'instagram_ads' | 'linkedin_ads' | 'linkedin_organic'
  | 'google_ads' | 'google_organic' | 'whatsapp' | 'email_marketing' | 'cold_call'
  | 'referral' | 'chatbot' | 'event' | 'direct' | 'other'

export type LeadQuality = 'hot' | 'warm' | 'cold' | 'unknown'
export type LeadPriority = 'urgent' | 'high' | 'medium' | 'low'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'negotiation' | 'closed_won' | 'closed_lost' | 'unqualified'

export interface ProcessedLead {
  // Información básica
  name: string
  email?: string
  phone?: string
  company?: string
  position?: string
  
  // Canal y fuente
  channel_type: LeadChannel
  source_id?: string
  source_name?: string
  
  // Datos específicos
  channel_data: Record<string, any>
  utm_data: Record<string, any>
  technical_data: Record<string, any>
  custom_fields: Record<string, any>
  
  // Contexto
  estimated_value?: number
  captured_at: Date
  
  // Payload original
  raw_payload: Record<string, any>
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface DuplicateMatch {
  lead_id: string
  confidence: number
  reason: string
}

export interface ChannelProcessor {
  channelType: LeadChannel
  
  processRawData(rawData: any): Promise<ProcessedLead>
  validateData(data: ProcessedLead): ValidationResult
  calculateChannelScore(data: ProcessedLead): number
  normalizeFields(data: any): Partial<ProcessedLead>
  findPotentialDuplicates(data: ProcessedLead, companyId: string): Promise<DuplicateMatch[]>
}

// =============================================
// PROCESADOR BASE
// =============================================

export abstract class BaseChannelProcessor implements ChannelProcessor {
  abstract channelType: LeadChannel

  async processRawData(rawData: any): Promise<ProcessedLead> {
    // Normalizar campos básicos
    const normalized = this.normalizeFields(rawData)
    
    // Construir lead procesado
    const processedLead: ProcessedLead = {
      name: normalized.name || 'Unknown',
      email: normalized.email,
      phone: normalized.phone,
      company: normalized.company,
      position: normalized.position,
      channel_type: this.channelType,
      source_id: normalized.source_id,
      source_name: normalized.source_name || this.getDefaultSourceName(),
      channel_data: normalized.channel_data || {},
      utm_data: normalized.utm_data || {},
      technical_data: normalized.technical_data || {},
      custom_fields: normalized.custom_fields || {},
      estimated_value: normalized.estimated_value,
      captured_at: new Date(),
      raw_payload: rawData
    }
    
    return processedLead
  }

  validateData(data: ProcessedLead): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Validaciones básicas
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Name is required')
    }
    
    if (!data.email && !data.phone) {
      errors.push('Either email or phone is required')
    }
    
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Invalid email format')
    }
    
    // Warnings específicos del canal
    if (!data.company) {
      warnings.push('Company information missing')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  calculateChannelScore(data: ProcessedLead): number {
    // Score base por canal (sobrescribir en implementaciones específicas)
    const channelScores: Record<LeadChannel, number> = {
      'linkedin_ads': 20,
      'linkedin_organic': 18,
      'referral': 25,
      'google_ads': 15,
      'web_form': 15,
      'facebook_ads': 12,
      'instagram_ads': 12,
      'whatsapp': 10,
      'email_marketing': 8,
      'cold_call': 5,
      'chatbot': 10,
      'event': 15,
      'google_organic': 10,
      'direct': 8,
      'other': 5
    }
    
    return channelScores[this.channelType] || 5
  }

  async findPotentialDuplicates(data: ProcessedLead, companyId: string): Promise<DuplicateMatch[]> {
    const supabase = await createClient()
    const matches: DuplicateMatch[] = []
    
    // Buscar por email exacto
    if (data.email) {
      const { data: emailMatches } = await supabase
        .from('unified_leads')
        .select('id, email, name, phone')
        .eq('company_id', companyId)
        .eq('email', data.email.toLowerCase())
        .limit(5)
      
      emailMatches?.forEach(match => {
        matches.push({
          lead_id: match.id,
          confidence: 0.95,
          reason: 'Exact email match'
        })
      })
    }
    
    // Buscar por teléfono exacto
    if (data.phone) {
      const cleanPhone = data.phone.replace(/\D/g, '')
      const { data: phoneMatches } = await supabase
        .from('unified_leads')
        .select('id, email, name, phone')
        .eq('company_id', companyId)
        .like('phone', `%${cleanPhone.slice(-8)}%`) // Últimos 8 dígitos
        .limit(5)
      
      phoneMatches?.forEach(match => {
        if (!matches.find(m => m.lead_id === match.id)) {
          matches.push({
            lead_id: match.id,
            confidence: 0.85,
            reason: 'Phone number match'
          })
        }
      })
    }
    
    // Buscar por nombre + empresa (fuzzy match)
    if (data.name && data.company) {
      const { data: nameMatches } = await supabase
        .from('unified_leads')
        .select('id, name, company, email')
        .eq('company_id', companyId)
        .ilike('name', `%${data.name.split(' ')[0]}%`)
        .ilike('company', `%${data.company}%`)
        .limit(5)
      
      nameMatches?.forEach(match => {
        if (!matches.find(m => m.lead_id === match.id)) {
          matches.push({
            lead_id: match.id,
            confidence: 0.70,
            reason: 'Name and company similarity'
          })
        }
      })
    }
    
    return matches.sort((a, b) => b.confidence - a.confidence)
  }

  protected abstract getDefaultSourceName(): string

  protected isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  protected normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '')
  }

  abstract normalizeFields(data: any): Partial<ProcessedLead>
}

// =============================================
// PROCESADOR FACEBOOK ADS
// =============================================

export class FacebookAdsProcessor extends BaseChannelProcessor {
  channelType: LeadChannel = 'facebook_ads'

  protected getDefaultSourceName(): string {
    return 'Facebook Lead Ad'
  }

  normalizeFields(data: any): Partial<ProcessedLead> {
    // Estructura típica de Facebook Lead Ads
    const leadData = data.field_data || data.leadgen_data || data
    
    // Extraer campos del array de field_data de Facebook
    const fields: Record<string, string> = {}
    if (Array.isArray(leadData)) {
      leadData.forEach((field: any) => {
        if (field.name && field.values && field.values[0]) {
          fields[field.name] = field.values[0]
        }
      })
    } else {
      Object.assign(fields, leadData)
    }
    
    return {
      name: fields.full_name || fields.first_name + ' ' + fields.last_name || fields.name,
      email: fields.email,
      phone: fields.phone_number || fields.phone,
      company: fields.company_name || fields.company,
      position: fields.job_title || fields.position,
      source_id: data.leadgen_id || data.lead_id,
      source_name: `Facebook Ad: ${data.ad_name || 'Unknown Campaign'}`,
      channel_data: {
        ad_id: data.ad_id,
        ad_name: data.ad_name,
        campaign_id: data.campaign_id,
        campaign_name: data.campaign_name,
        form_id: data.form_id,
        form_name: data.form_name,
        page_id: data.page_id,
        page_name: data.page_name,
        custom_questions: this.extractCustomQuestions(fields)
      },
      utm_data: {
        utm_source: 'facebook',
        utm_medium: 'paid_social',
        utm_campaign: data.campaign_name || data.campaign_id,
        utm_content: data.ad_name || data.ad_id,
        utm_term: data.ad_set_name || data.adset_id
      },
      technical_data: {
        platform: 'facebook',
        created_time: data.created_time,
        locale: data.locale || 'en_US'
      }
    }
  }

  calculateChannelScore(data: ProcessedLead): number {
    let score = super.calculateChannelScore(data) // Base: 12 puntos
    
    // Bonus por calidad del lead de Facebook
    const channelData = data.channel_data
    
    // Campañas con palabras clave de alta intención
    if (channelData.campaign_name?.match(/(demo|trial|pricing|quote|consultation)/i)) {
      score += 8
    }
    
    // Formularios más largos suelen ser de mayor calidad
    const customQuestions = channelData.custom_questions || []
    if (customQuestions.length >= 3) {
      score += 5
    }
    
    // Página verificada de Facebook
    if (channelData.page_verified) {
      score += 3
    }
    
    return Math.min(score, 30) // Máximo 30 puntos por canal
  }

  private extractCustomQuestions(fields: Record<string, string>): Array<{question: string, answer: string}> {
    const customQuestions: Array<{question: string, answer: string}> = []
    const standardFields = ['full_name', 'first_name', 'last_name', 'email', 'phone_number', 'phone', 'company_name', 'job_title']
    
    Object.entries(fields).forEach(([key, value]) => {
      if (!standardFields.includes(key) && value) {
        customQuestions.push({
          question: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          answer: value
        })
      }
    })
    
    return customQuestions
  }
}

// =============================================
// PROCESADOR LINKEDIN ADS
// =============================================

export class LinkedInAdsProcessor extends BaseChannelProcessor {
  channelType: LeadChannel = 'linkedin_ads'

  protected getDefaultSourceName(): string {
    return 'LinkedIn Lead Gen Form'
  }

  normalizeFields(data: any): Partial<ProcessedLead> {
    // Estructura típica de LinkedIn Lead Gen Forms
    const formData = data.formResponse || data.leadData || data
    
    return {
      name: formData.firstName + ' ' + formData.lastName || formData.fullName,
      email: formData.emailAddress || formData.email,
      phone: formData.phoneNumber || formData.phone,
      company: formData.companyName || formData.company,
      position: formData.jobTitle || formData.title,
      source_id: data.leadId || data.id,
      source_name: `LinkedIn Campaign: ${data.campaignName || 'Unknown'}`,
      channel_data: {
        campaign_id: data.campaignId,
        campaign_name: data.campaignName,
        creative_id: data.creativeId,
        account_id: data.accountId,
        form_id: data.formId,
        linkedin_member_id: formData.linkedInMemberId,
        seniority_level: formData.seniorityLevel,
        company_size: formData.companySize,
        industry: formData.industry,
        professional_headline: formData.headline
      },
      utm_data: {
        utm_source: 'linkedin',
        utm_medium: 'paid_social',
        utm_campaign: data.campaignName || data.campaignId,
        utm_content: data.creativeName || data.creativeId
      },
      technical_data: {
        platform: 'linkedin',
        submitted_at: data.submittedAt,
        member_country: formData.country
      },
      estimated_value: this.estimateValueFromLinkedInData(formData)
    }
  }

  calculateChannelScore(data: ProcessedLead): number {
    let score = super.calculateChannelScore(data) // Base: 20 puntos
    
    const channelData = data.channel_data
    
    // Bonus por seniority level
    switch (channelData.seniority_level) {
      case 'C_SUITE':
      case 'VP':
        score += 15
        break
      case 'DIRECTOR':
      case 'MANAGER':
        score += 10
        break
      case 'SENIOR':
        score += 5
        break
    }
    
    // Bonus por tamaño de empresa
    switch (channelData.company_size) {
      case 'SIZE_1001_TO_5000':
      case 'SIZE_5001_TO_10000':
      case 'SIZE_10001_OR_MORE':
        score += 10
        break
      case 'SIZE_201_TO_500':
      case 'SIZE_501_TO_1000':
        score += 5
        break
    }
    
    // Bonus por industria objetivo
    const targetIndustries = ['SOFTWARE', 'TECHNOLOGY', 'FINANCIAL_SERVICES', 'CONSULTING']
    if (targetIndustries.includes(channelData.industry)) {
      score += 5
    }
    
    return Math.min(score, 50) // Máximo 50 puntos por canal (LinkedIn es premium)
  }

  private estimateValueFromLinkedInData(formData: any): number {
    let value = 0
    
    // Valor base por seniority
    switch (formData.seniorityLevel) {
      case 'C_SUITE': value += 50000; break
      case 'VP': value += 30000; break
      case 'DIRECTOR': value += 20000; break
      case 'MANAGER': value += 10000; break
      default: value += 5000
    }
    
    // Multiplicador por tamaño de empresa
    switch (formData.companySize) {
      case 'SIZE_10001_OR_MORE': value *= 2; break
      case 'SIZE_5001_TO_10000': value *= 1.8; break
      case 'SIZE_1001_TO_5000': value *= 1.5; break
      case 'SIZE_501_TO_1000': value *= 1.2; break
    }
    
    return Math.round(value)
  }

  private extractCustomQuestions(fields: Record<string, string>): Array<{question: string, answer: string}> {
    const customQuestions: Array<{question: string, answer: string}> = []
    const standardFields = ['firstName', 'lastName', 'fullName', 'emailAddress', 'email', 'phoneNumber', 'phone', 'companyName', 'company', 'jobTitle', 'title']
    
    Object.entries(fields).forEach(([key, value]) => {
      if (!standardFields.includes(key) && value) {
        customQuestions.push({
          question: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          answer: value
        })
      }
    })
    
    return customQuestions
  }
}

// =============================================
// PROCESADOR WHATSAPP BUSINESS
// =============================================

export class WhatsAppProcessor extends BaseChannelProcessor {
  channelType: LeadChannel = 'whatsapp'

  protected getDefaultSourceName(): string {
    return 'WhatsApp Message'
  }

  normalizeFields(data: any): Partial<ProcessedLead> {
    // Estructura típica de WhatsApp Business API webhook
    const message = data.messages?.[0] || data.message || data
    const contact = data.contacts?.[0] || data.contact || {}
    
    return {
      name: contact.profile?.name || this.extractNameFromMessage(message.text?.body || ''),
      phone: message.from || data.phone,
      source_id: message.id || data.message_id,
      source_name: 'WhatsApp Business',
      channel_data: {
        message_id: message.id,
        message_type: message.type,
        message_body: message.text?.body || message.caption,
        contact_wa_id: contact.wa_id,
        profile_name: contact.profile?.name,
        timestamp: message.timestamp,
        business_phone_number_id: data.metadata?.phone_number_id,
        conversation_category: this.categorizeMessage(message.text?.body || ''),
        has_media: ['image', 'video', 'document', 'audio'].includes(message.type)
      },
      utm_data: {
        utm_source: 'whatsapp',
        utm_medium: 'messaging'
      },
      technical_data: {
        platform: 'whatsapp',
        message_timestamp: message.timestamp,
        webhook_id: data.id
      }
    }
  }

  calculateChannelScore(data: ProcessedLead): number {
    let score = super.calculateChannelScore(data) // Base: 10 puntos
    
    const channelData = data.channel_data
    const messageBody = channelData.message_body?.toLowerCase() || ''
    
    // Bonus por palabras clave de alta intención
    const highIntentKeywords = ['precio', 'cotización', 'quote', 'demo', 'información', 'servicio']
    if (highIntentKeywords.some(keyword => messageBody.includes(keyword))) {
      score += 8
    }
    
    // Bonus por mensajes largos (más contexto)
    if (messageBody.length > 100) {
      score += 5
    }
    
    // Bonus por adjuntos de media
    if (channelData.has_media) {
      score += 3
    }
    
    // Penalización por mensajes muy cortos o genéricos
    if (messageBody.length < 20 || ['hi', 'hello', 'hola'].includes(messageBody.trim())) {
      score -= 5
    }
    
    return Math.max(score, 0) // Mínimo 0 puntos
  }

  private extractNameFromMessage(message: string): string {
    // Intentar extraer nombre de mensajes como "Hola, soy Juan Pérez"
    const patterns = [
      /soy\s+([a-záéíóúñ\s]+)/i,
      /me\s+llamo\s+([a-záéíóúñ\s]+)/i,
      /mi\s+nombre\s+es\s+([a-záéíóúñ\s]+)/i,
      /i'm\s+([a-z\s]+)/i,
      /my\s+name\s+is\s+([a-z\s]+)/i
    ]
    
    for (const pattern of patterns) {
      const match = message.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }
    
    return 'WhatsApp Contact'
  }

  private categorizeMessage(message: string): string {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('precio') || lowerMessage.includes('cotización') || lowerMessage.includes('quote')) {
      return 'pricing_inquiry'
    }
    
    if (lowerMessage.includes('demo') || lowerMessage.includes('presentación')) {
      return 'demo_request'
    }
    
    if (lowerMessage.includes('información') || lowerMessage.includes('details')) {
      return 'information_request'
    }
    
    if (lowerMessage.includes('problema') || lowerMessage.includes('ayuda') || lowerMessage.includes('support')) {
      return 'support_inquiry'
    }
    
    return 'general_inquiry'
  }
}

// =============================================
// PROCESADOR WEB FORMS (MIGRACIÓN DE CONTACT LEADS)
// =============================================

export class WebFormProcessor extends BaseChannelProcessor {
  channelType: LeadChannel = 'web_form'

  protected getDefaultSourceName(): string {
    return 'Website Contact Form'
  }

  normalizeFields(data: any): Partial<ProcessedLead> {
    return {
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      source_id: data.form_id || 'website_contact_form',
      source_name: data.form_name || 'Website Contact Form',
      channel_data: {
        pain_point: data.pain_point,
        website: data.website,
        message: data.message,
        form_id: data.form_id,
        page_url: data.page_url
      },
      utm_data: {
        utm_source: data.utm_source,
        utm_medium: data.utm_medium,
        utm_campaign: data.utm_campaign,
        utm_content: data.utm_content,
        utm_term: data.utm_term
      },
      technical_data: {
        user_agent: data.user_agent,
        referrer: data.referrer,
        ip_address: data.ip_address,
        page_url: data.page_url
      }
    }
  }

  calculateChannelScore(data: ProcessedLead): number {
    let score = super.calculateChannelScore(data) // Base: 15 puntos
    
    const channelData = data.channel_data
    
    // Bonus por pain point detallado
    if (channelData.pain_point && channelData.pain_point.length > 50) {
      score += 10
    }
    
    // Bonus por presencia de website
    if (channelData.website) {
      score += 5
    }
    
    // Bonus por UTM campaign con alta intención
    if (data.utm_data.utm_campaign?.match(/(demo|trial|pricing|enterprise)/i)) {
      score += 8
    }
    
    return score
  }
}

// =============================================
// FACTORY PARA PROCESADORES
// =============================================

export class ChannelProcessorFactory {
  private static processors: Map<LeadChannel, () => ChannelProcessor> = new Map([
    ['facebook_ads', () => new FacebookAdsProcessor()],
    ['instagram_ads', () => new FacebookAdsProcessor()], // Usa el mismo procesador
    ['linkedin_ads', () => new LinkedInAdsProcessor() as ChannelProcessor],
    ['whatsapp', () => new WhatsAppProcessor() as ChannelProcessor],
    ['web_form', () => new WebFormProcessor() as ChannelProcessor],
  ])

  static getProcessor(channel: LeadChannel): ChannelProcessor {
    const processorFactory = this.processors.get(channel)
    
    if (!processorFactory) {
      throw new Error(`No processor found for channel: ${channel}`)
    }
    
    return processorFactory()
  }

  static getSupportedChannels(): LeadChannel[] {
    return Array.from(this.processors.keys())
  }

  static registerProcessor(channel: LeadChannel, processorFactory: () => ChannelProcessor): void {
    this.processors.set(channel, processorFactory)
  }
}

// =============================================
// SERVICIO PRINCIPAL DE PROCESAMIENTO
// =============================================

export class LeadProcessingService {
  static async processLead(
    rawData: any, 
    channel: LeadChannel, 
    companyId: string
  ): Promise<{ lead: ProcessedLead; validation: ValidationResult; duplicates: DuplicateMatch[] }> {
    const processor = ChannelProcessorFactory.getProcessor(channel)
    
    // Procesar datos
    const processedLead = await processor.processRawData(rawData)
    
    // Validar
    const validation = processor.validateData(processedLead)
    
    // Buscar duplicados
    const duplicates = await processor.findPotentialDuplicates(processedLead, companyId)
    
    return {
      lead: processedLead,
      validation,
      duplicates
    }
  }

  static async saveLead(
    processedLead: ProcessedLead, 
    companyId: string, 
    options: { skipDuplicateCheck?: boolean } = {}
  ): Promise<string> {
    const supabase = await createClient()
    
    // Insertar en la base de datos
    const { data, error } = await supabase
      .from('unified_leads')
      .insert({
        company_id: companyId,
        ...processedLead
      })
      .select('id')
      .single()
    
    if (error) {
      throw new Error(`Failed to save lead: ${error.message}`)
    }
    
    return data.id
  }
} 