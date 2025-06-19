import { supabase as browserClient, Lead, Contact, Activity, Pipeline, Campaign } from './supabase'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { isSuperAdmin } from './super-admin'

// Función para obtener el company_id del usuario actual en el servidor
async function getCompanyIdForCurrentUser(): Promise<string> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No authenticated user')
  }

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (error || !profile?.company_id) {
    console.error(`[GET_COMPANY_ID_ERROR] User ${user.id} has no company or profile error.`, error)
    throw new Error('User has no company assigned or profile could not be fetched.')
  }

  return profile.company_id
}

// Lead Scoring Algorithm (sin cambios)
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

// =============================================
// CRUD OPERATIONS FOR LEADS (MULTI-TENANT)
// =============================================

export async function createLead(
  leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'company_id'>,
  companyId?: string
): Promise<Lead> {
  const company_id = companyId || await getCompanyIdForCurrentUser()
  const score = calculateLeadScore(leadData)
  const temperature = getLeadTemperature(score)
  const priority = getLeadPriority({ ...leadData, score })

  const { data, error } = await browserClient
    .from('leads')
    .insert([{
      ...leadData,
      company_id,
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
  assigned_to?: string
  limit?: number
}): Promise<Lead[]> {
  let query = browserClient
    .from('leads')
    .select('*')

  if (filters?.source) query = query.eq('source', filters.source)
  if (filters?.temperature) query = query.eq('temperature', filters.temperature)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to)
  if (filters?.limit) query = query.limit(filters.limit)

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
  const { data, error } = await browserClient
    .from('leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await browserClient
    .from('leads')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// =============================================
// CRUD OPERATIONS FOR CONTACTS (MULTI-TENANT)
// =============================================

export async function createContact(
  contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'company_id'>,
  companyId?: string
): Promise<Contact> {
  const company_id = companyId || await getCompanyIdForCurrentUser()

  const { data, error } = await browserClient
    .from('contacts')
    .insert([{ ...contactData, company_id }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getContacts(filters?: {
  status?: string
  source?: string
  assigned_to?: string
  limit?: number
}): Promise<Contact[]> {
  let query = browserClient
    .from('contacts')
    .select('*')

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.source) query = query.eq('source', filters.source)
  if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to)
  if (filters?.limit) query = query.limit(filters.limit)

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function findContactByEmail(email: string): Promise<Contact | null> {
  const { data, error } = await browserClient
    .from('contacts')
    .select('*')
    .eq('email', email)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function findContactByPhone(phone: string): Promise<Contact | null> {
  const { data, error } = await browserClient
    .from('contacts')
    .select('*')
    .eq('phone', phone)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

// =============================================
// CRUD OPERATIONS FOR ACTIVITIES (MULTI-TENANT)
// =============================================

export async function createActivity(
  activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at' | 'company_id'>,
  companyId?: string
): Promise<Activity> {
  const company_id = companyId || await getCompanyIdForCurrentUser()

  const { data, error } = await browserClient
    .from('activities')
    .insert([{ ...activityData, company_id, user_id: activityData.user_id }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getActivities(filters?: {
  contact_id?: string
  lead_id?: string
  user_id?: string
  type?: string
  status?: string
  limit?: number
}): Promise<Activity[]> {
  let query = browserClient
    .from('activities')
    .select('*')

  if (filters?.contact_id) query = query.eq('contact_id', filters.contact_id)
  if (filters?.lead_id) query = query.eq('lead_id', filters.lead_id)
  if (filters?.user_id) query = query.eq('user_id', filters.user_id)
  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.limit) query = query.limit(filters.limit)

  query = query.order('created_at', { ascending: false })
  
  const { data, error } = await query
  if (error) throw error
  return data || []
}

// =============================================
// CRUD OPERATIONS FOR PIPELINE (MULTI-TENANT)
// =============================================

export async function createPipelineEntry(
  pipelineData: Omit<Pipeline, 'id' | 'created_at' | 'updated_at' | 'company_id'>,
  companyId?: string
): Promise<Pipeline> {
  const company_id = companyId || await getCompanyIdForCurrentUser()

  const { data, error } = await browserClient
    .from('pipeline')
    .insert([{ ...pipelineData, company_id }])
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
  let query = browserClient
    .from('pipeline')
    .select(`
      *,
      contact:contacts(*),
      lead:leads(*)
    `)

  if (filters?.stage) query = query.eq('stage', filters.stage)
  if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to)
  if (filters?.limit) query = query.limit(filters.limit)

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function updatePipelineStage(
  id: string, 
  stage: Pipeline['stage'], 
  updates?: Partial<Pipeline>
): Promise<Pipeline> {
  const { data, error } = await browserClient
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

// =============================================
// CRM Metrics
// =============================================

export async function getLeadMetrics(): Promise<{
  total: number
  hot: number
  warm: number
  cold: number
  bySource: Record<string, number>
  thisWeek: number
  conversionRate: number
}> {
  const { data: leads, error } = await browserClient
    .from('leads')
    .select('source, temperature, created_at, status')

  if (error) throw error

  const total = leads.length
  const hot = leads.filter(l => l.temperature === 'hot').length
  const warm = leads.filter(l => l.temperature === 'warm').length
  const cold = leads.filter(l => l.temperature === 'cold').length
  
  const bySource = leads.reduce((acc, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const thisWeek = leads.filter(l => new Date(l.created_at) > oneWeekAgo).length
  
  const converted = leads.filter(l => l.status === 'converted').length
  const conversionRate = total > 0 ? (converted / total) * 100 : 0

  return { total, hot, warm, cold, bySource, thisWeek, conversionRate }
}

export async function getPipelineMetrics(): Promise<{
  totalValue: number
  totalOpportunities: number
  averageValue: number
  closeRate: number
  byStage: Record<string, { count: number; value: number }>
}> {
  const { data: pipeline, error } = await browserClient
    .from('pipeline')
    .select('stage, value, probability')

  if (error) throw error

  const totalOpportunities = pipeline.length
  const totalValue = pipeline.reduce((sum, p) => sum + (p.value || 0), 0)
  const averageValue = totalOpportunities > 0 ? totalValue / totalOpportunities : 0
  
  const won = pipeline.filter(p => p.stage === 'won').length
  const closeRate = totalOpportunities > 0 ? (won / totalOpportunities) * 100 : 0
  
  const byStage = pipeline.reduce((acc, p) => {
    if (!acc[p.stage]) {
      acc[p.stage] = { count: 0, value: 0 }
    }
    acc[p.stage].count += 1
    acc[p.stage].value += p.value || 0
    return acc
  }, {} as Record<string, { count: number; value: number }>)

  return { totalValue, totalOpportunities, averageValue, closeRate, byStage }
}


// =============================================
// Company & User Management (FINAL - CORRECT AUTH LOGIC)
// =============================================

export async function getCurrentCompany(companyIdFromQuery: string) {
  const supabase = await createServerClient();

  // 1. Authenticate the user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Authentication failed');
  }

  // 2. Authorize the user (with correct logic for super admins)
  const userIsSuperAdmin = await isSuperAdmin(user.id);

  if (!userIsSuperAdmin) {
    // If not a super admin, we must check their profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      throw new Error(`No profile found for user ${user.id}`);
    }

    if (userProfile.company_id !== companyIdFromQuery) {
      throw new Error('User is not authorized to view this company');
    }
  }
  // If the user IS a super admin, we grant access without a profile check.

  // 3. Fetch company data with the correctly named template table
  const { data: company, error } = await supabase
    .from('companies')
    .select(`
      id,
      name,
      features,
      template:client_templates (available_features)
    `)
    .eq('id', companyIdFromQuery)
    .single();

  if (error) {
    throw new Error(`Database error fetching company: ${error.message}`);
  }
  if (!company) {
    throw new Error(`Company with ID ${companyIdFromQuery} not found.`);
  }

  // 4. Determine final features
  let finalFeatures: string[] = [];
  if (company.features && Array.isArray(company.features) && company.features.length > 0) {
    finalFeatures = company.features;
  } else if (company.template && 'available_features' in company.template && Array.isArray(company.template.available_features)) {
    finalFeatures = company.template.available_features;
  }

  return {
    id: company.id,
    name: company.name,
    features: finalFeatures,
  };
}

export async function getAvailableModules() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('category', { ascending: true });

  if (error) {
    console.error('[GET_AVAILABLE_MODULES] DB Error:', error.message);
    throw new Error(`Database error fetching modules: ${error.message}`);
  }
  return data || [];
}

export async function updateCompanySettings(
  settings: Partial<{ 
    name: string
    logo_url: string
    timezone: string
    locale: string
    settings: Record<string, any>
  }>
) {
  const companyId = await getCompanyIdForCurrentUser()
  
  const { data, error } = await browserClient
    .from('companies')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('id', companyId)
    .select()
    .single()

  if (error) throw error
  return data
}


export async function getCompanyUsers() {
  const companyId = await getCompanyIdForCurrentUser()
  
  const { data, error } = await browserClient
    .from('user_profiles')
    .select('*')
    .eq('company_id', companyId)

  if (error) throw error
  return data
}

// =============================================
// Integrations & Notifications
// =============================================
// These would be more fleshed out in a real app
export async function sendSlackNotification(message: string): Promise<void> {
  // Mock implementation
  console.log(`[SLACK NOTIFICATION]: ${message}`)
  // In a real app, you would use the Slack API here
  // const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL
  // await fetch(slackWebhookUrl, { method: 'POST', body: JSON.stringify({ text: message }) })
}

export async function sendEmailNotification(lead: Lead): Promise<void> {
  // Mock implementation
  console.log(`[EMAIL NOTIFICATION]: New lead received: ${lead.name} (${lead.email})`)
  // In a real app, you would use an email service like SendGrid, Resend, etc.
} 