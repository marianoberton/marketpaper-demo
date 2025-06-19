import { supabase, Lead, Contact, Activity, Pipeline, Campaign } from './supabase'

// Lead Scoring Algorithm
export function calculateLeadScore(leadData: Partial<Lead>): number {
  let score = 0

  // Puntuación por fuente (0-25 puntos)
  const sourceScores = {
    'web-form': 25,
    'facebook-ads': 20,
    'instagram-ads': 20,
    'linkedin-organic': 25,
    'google-ads': 22,
    'referral': 25,
    'whatsapp': 18,
    'cold-outreach': 10
  }
  score += sourceScores[leadData.source as keyof typeof sourceScores] || 10

  // Puntuación por información de contacto (0-20 puntos)
  if (leadData.email) score += 10
  if (leadData.phone) score += 10

  // Puntuación por información de empresa (0-15 puntos)
  if (leadData.company) score += 10
  if (leadData.company && leadData.company.length > 3) score += 5

  // Puntuación por engagement (0-20 puntos)
  if (leadData.message && leadData.message.length > 50) score += 10
  if (leadData.utm_campaign) score += 5
  if (leadData.page_url && leadData.page_url.includes('/pricing')) score += 5

  // Puntuación por timing (0-10 puntos)
  const hour = new Date().getHours()
  if (hour >= 9 && hour <= 17) score += 5 // Horario comercial
  
  const day = new Date().getDay()
  if (day >= 1 && day <= 5) score += 5 // Días laborables

  // Puntuación por palabras clave en mensaje (0-10 puntos)
  if (leadData.message) {
    const highValueKeywords = [
      'presupuesto', 'cotización', 'precio', 'contratar',
      'urgente', 'proyecto', 'necesito', 'cuando'
    ]
    
    const messageWords = leadData.message.toLowerCase()
    const keywordMatches = highValueKeywords.filter(keyword => 
      messageWords.includes(keyword)
    ).length
    
    score += Math.min(keywordMatches * 2, 10)
  }

  // Asegurar que el score esté entre 0 y 100
  return Math.min(Math.max(score, 0), 100)
}

export function getLeadTemperature(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 80) return 'hot'
  if (score >= 50) return 'warm'
  return 'cold'
}

export function getLeadPriority(leadData: Partial<Lead>): 'high' | 'medium' | 'low' {
  const score = leadData.score || calculateLeadScore(leadData)
  const temperature = getLeadTemperature(score)
  
  let priority: 'high' | 'medium' | 'low' = 'medium'
  
  if (temperature === 'hot') priority = 'high'
  if (temperature === 'cold') priority = 'low'
  
  // Ajustar por fuente
  if (leadData.source === 'referral') priority = 'high'
  if (leadData.source === 'cold-outreach') priority = 'low'
  
  // Ajustar por palabras clave urgentes
  if (leadData.message && leadData.message.toLowerCase().includes('urgente')) {
    priority = 'high'
  }
  
  return priority
}

// CRUD Operations for Leads
export async function createLead(leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
  const score = calculateLeadScore(leadData)
  const temperature = getLeadTemperature(score)
  const priority = getLeadPriority({ ...leadData, score })

  const { data, error } = await supabase
    .from('leads')
    .insert([{
      ...leadData,
      score,
      temperature,
      priority,
      status: leadData.status || 'new'
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getLeads(filters?: {
  source?: string
  temperature?: string
  status?: string
  limit?: number
}): Promise<Lead[]> {
  let query = supabase.from('leads').select('*')

  if (filters?.source) query = query.eq('source', filters.source)
  if (filters?.temperature) query = query.eq('temperature', filters.temperature)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.limit) query = query.limit(filters.limit)

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// CRUD Operations for Contacts
export async function createContact(contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> {
  const { data, error } = await supabase
    .from('contacts')
    .insert([contactData])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getContacts(filters?: {
  status?: string
  source?: string
  limit?: number
}): Promise<Contact[]> {
  let query = supabase.from('contacts').select('*')

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.source) query = query.eq('source', filters.source)
  if (filters?.limit) query = query.limit(filters.limit)

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function findContactByEmail(email: string): Promise<Contact | null> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('email', email)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function findContactByPhone(phone: string): Promise<Contact | null> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('phone', phone)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

// CRUD Operations for Activities
export async function createActivity(activityData: Omit<Activity, 'id' | 'created_at'>): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .insert([activityData])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getActivities(filters?: {
  contact_id?: string
  lead_id?: string
  type?: string
  status?: string
  limit?: number
}): Promise<Activity[]> {
  let query = supabase.from('activities').select('*')

  if (filters?.contact_id) query = query.eq('contact_id', filters.contact_id)
  if (filters?.lead_id) query = query.eq('lead_id', filters.lead_id)
  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.limit) query = query.limit(filters.limit)

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// CRUD Operations for Pipeline
export async function createPipelineEntry(pipelineData: Omit<Pipeline, 'id' | 'created_at' | 'updated_at'>): Promise<Pipeline> {
  const { data, error } = await supabase
    .from('pipeline')
    .insert([pipelineData])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getPipelineEntries(filters?: {
  stage?: string
  assigned_to?: string
  limit?: number
}): Promise<Pipeline[]> {
  let query = supabase.from('pipeline').select(`
    *,
    leads (
      id,
      name,
      email,
      company,
      source,
      temperature,
      priority
    )
  `)

  if (filters?.stage) query = query.eq('stage', filters.stage)
  if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to)
  if (filters?.limit) query = query.limit(filters.limit)

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function updatePipelineStage(id: string, stage: Pipeline['stage'], updates?: Partial<Pipeline>): Promise<Pipeline> {
  const { data, error } = await supabase
    .from('pipeline')
    .update({ 
      stage, 
      ...updates, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Analytics and Reporting
export async function getLeadMetrics(): Promise<{
  total: number
  hot: number
  warm: number
  cold: number
  bySource: Record<string, number>
  thisWeek: number
  conversionRate: number
}> {
  const { data: leads, error } = await supabase
    .from('leads')
    .select('source, temperature, created_at, status')

  if (error) throw error

  const total = leads?.length || 0
  const hot = leads?.filter(l => l.temperature === 'hot').length || 0
  const warm = leads?.filter(l => l.temperature === 'warm').length || 0
  const cold = leads?.filter(l => l.temperature === 'cold').length || 0

  const bySource = leads?.reduce((acc, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const thisWeek = leads?.filter(l => new Date(l.created_at) > weekAgo).length || 0

  const converted = leads?.filter(l => l.status === 'closed-won').length || 0
  const conversionRate = total > 0 ? (converted / total) * 100 : 0

  return {
    total,
    hot,
    warm,
    cold,
    bySource,
    thisWeek,
    conversionRate
  }
}

export async function getPipelineMetrics(): Promise<{
  totalValue: number
  totalOpportunities: number
  averageValue: number
  closeRate: number
  byStage: Record<string, { count: number; value: number }>
}> {
  const { data: pipeline, error } = await supabase
    .from('pipeline')
    .select('stage, value, probability')

  if (error) throw error

  const totalValue = pipeline?.reduce((sum, p) => sum + p.value, 0) || 0
  const totalOpportunities = pipeline?.length || 0
  const averageValue = totalOpportunities > 0 ? totalValue / totalOpportunities : 0

  const closed = pipeline?.filter(p => p.stage === 'closed-won' || p.stage === 'closed-lost') || []
  const won = pipeline?.filter(p => p.stage === 'closed-won') || []
  const closeRate = closed.length > 0 ? (won.length / closed.length) * 100 : 0

  const byStage = pipeline?.reduce((acc, p) => {
    if (!acc[p.stage]) {
      acc[p.stage] = { count: 0, value: 0 }
    }
    acc[p.stage].count++
    acc[p.stage].value += p.value
    return acc
  }, {} as Record<string, { count: number; value: number }>) || {}

  return {
    totalValue,
    totalOpportunities,
    averageValue,
    closeRate,
    byStage
  }
}

// Notification Functions
export async function sendSlackNotification(message: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) return

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    })
  } catch (error) {
    console.error('Error sending Slack notification:', error)
  }
}

export async function sendEmailNotification(lead: Lead): Promise<void> {
  // Implementar notificación por email
  console.log('Email notification for lead:', lead.name)
}