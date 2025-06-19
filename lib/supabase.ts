import { createClient } from '@supabase/supabase-js'

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug: Log environment variables (for development)
if (process.env.NODE_ENV === 'development') {
  console.log('SUPABASE ENV VARS DEBUG:')
  console.log('URL:', supabaseUrl ? '✓ Set' : '✗ Missing')
  console.log('ANON KEY:', supabaseAnonKey ? `✓ Set (${supabaseAnonKey.length} chars)` : '✗ Missing')
}

// Validation
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please check your .env.local file.')
}
if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please check your .env.local file.')
}

// Cliente Supabase con soporte multi-tenant
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-client-info': 'fomo-crm@1.0.0'
    }
  }
})

// Cliente Supabase para servidor (con service role)
// Esta función solo debe usarse en el servidor (API routes, server components)
export function createSupabaseAdmin() {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Please check your .env.local file.')
  }
  
  return createClient(supabaseUrl!, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Types for our Multi-Tenant CRM database
export interface Company {
  id: string
  created_at: string
  updated_at: string
  name: string
  slug: string
  domain?: string
  settings: Record<string, any>
  features: string[]
  plan: 'starter' | 'professional' | 'enterprise'
  max_users: number
  max_contacts: number
  status: 'active' | 'suspended' | 'cancelled'
  logo_url?: string
  timezone: string
  locale: string
  billing_email?: string
  subscription_id?: string
  trial_ends_at?: string
}

export interface UserProfile {
  id: string
  created_at: string
  updated_at: string
  email: string
  full_name?: string
  avatar_url?: string
  company_id: string
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer'
  permissions: string[]
  status: 'active' | 'inactive' | 'pending'
  last_login?: string
  preferences: Record<string, any>
  timezone: string
  locale: string
}

export interface Lead {
  id: string
  created_at: string
  updated_at: string
  company_id: string
  name: string
  email: string
  phone?: string
  company?: string
  message?: string
  source: 'web-form' | 'facebook-ads' | 'instagram-ads' | 'linkedin-organic' | 'google-ads' | 'referral' | 'whatsapp' | 'cold-outreach'
  utm_source?: string
  utm_campaign?: string
  utm_medium?: string
  utm_content?: string
  page_url?: string
  score: number
  temperature: 'hot' | 'warm' | 'cold'
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  priority: 'high' | 'medium' | 'low'
  assigned_to?: string
  last_contact?: string
  next_follow_up?: string
  notes?: string
  meta_lead_id?: string
  form_id?: string
  page_id?: string
}

export interface Contact {
  id: string
  created_at: string
  updated_at: string
  company_id: string
  name: string
  email: string
  phone?: string
  company?: string
  position?: string
  source: string
  status: 'lead' | 'prospect' | 'customer' | 'inactive'
  lead_id?: string
  assigned_to?: string
  tags?: string[]
  notes?: string
  last_interaction?: string
}

export interface Activity {
  id: string
  created_at: string
  company_id: string
  contact_id: string
  lead_id?: string
  user_id?: string
  type: 'email' | 'phone' | 'meeting' | 'whatsapp' | 'task' | 'note' | 'social'
  direction: 'inbound' | 'outbound'
  subject?: string
  content: string
  status: 'completed' | 'scheduled' | 'pending'
  priority: 'high' | 'medium' | 'low'
  outcome?: 'positive' | 'negative' | 'neutral'
  scheduled_for?: string
  completed_at?: string
  duration?: number
  assigned_to?: string
  attachments?: string[]
  whatsapp_message_id?: string
  meta_data?: Record<string, any>
}

export interface Pipeline {
  id: string
  created_at: string
  updated_at: string
  company_id: string
  lead_id: string
  stage: 'leads' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  value: number
  probability: number
  expected_close_date?: string
  actual_close_date?: string
  close_reason?: string
  notes?: string
  assigned_to?: string
}

export interface Campaign {
  id: string
  created_at: string
  updated_at: string
  company_id: string
  name: string
  type: 'facebook' | 'instagram' | 'linkedin' | 'google' | 'email' | 'whatsapp'
  status: 'active' | 'paused' | 'completed'
  budget: number
  spent: number
  leads_generated: number
  conversions: number
  start_date: string
  end_date?: string
  utm_campaign: string
  utm_source: string
  utm_medium: string
  created_by?: string
  assigned_to?: string
  meta_data?: Record<string, any>
}