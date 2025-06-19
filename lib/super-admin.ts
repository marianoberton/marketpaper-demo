import { createSupabaseAdmin } from './supabase'

// =============================================
// SUPER ADMIN TYPES
// =============================================

export interface SuperAdmin {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: 'super_admin' | 'admin' | 'support'
  permissions: string[]
  status: 'active' | 'inactive' | 'suspended'
  last_login?: string
}

export interface ClientTemplate {
  id: string
  created_at: string
  updated_at: string
  name: string
  description?: string
  category: string
  dashboard_config: Record<string, any>
  workspace_config: Record<string, any>
  available_features: string[]
  default_permissions: Record<string, any>
  max_users: number
  max_contacts: number
  max_api_calls: number
  monthly_price: number
  setup_fee: number
  is_active: boolean
  created_by?: string
}

export interface CompanyApiKey {
  id: string
  created_at: string
  updated_at: string
  company_id: string
  service: string
  key_name: string
  encrypted_key: string
  config: Record<string, any>
  endpoints?: string[]
  rate_limits: Record<string, any>
  total_calls: number
  total_cost: number
  last_used?: string
  monthly_limit_calls?: number
  monthly_limit_cost?: number
  daily_limit_calls?: number
  daily_limit_cost?: number
  status: 'active' | 'inactive' | 'suspended' | 'expired'
  expires_at?: string
}

export interface UserApiKey {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  company_id: string
  service: string
  key_identifier: string
  encrypted_key: string
  total_calls: number
  total_tokens: number
  total_cost: number
  last_used?: string
  monthly_limit_calls: number
  monthly_limit_tokens: number
  monthly_limit_cost: number
  current_month_calls: number
  current_month_tokens: number
  current_month_cost: number
  current_month_reset: string
  status: 'active' | 'inactive' | 'suspended' | 'over_limit'
}

export interface ApiUsageLog {
  id: string
  created_at: string
  company_id: string
  user_id?: string
  service: string
  endpoint?: string
  method?: string
  tokens_used: number
  cost: number
  response_time?: number
  status: 'success' | 'error' | 'timeout' | 'rate_limited'
  ip_address?: string
  user_agent?: string
}

export interface DailyUsageStats {
  id: string
  date: string
  company_id: string
  user_id?: string
  service: string
  total_calls: number
  total_tokens: number
  total_cost: number
  avg_response_time: number
  error_count: number
}

// =============================================
// SUPER ADMIN FUNCTIONS
// =============================================

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const supabaseAdmin = createSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('super_admins')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  return !error && !!data
}

export async function createSuperAdmin(userData: {
  user_id: string
  email: string
  full_name?: string
  role?: 'super_admin' | 'admin' | 'support'
  permissions?: string[]
}): Promise<SuperAdmin> {
  const supabaseAdmin = createSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('super_admins')
    .insert([{
      ...userData,
      role: userData.role || 'admin',
      permissions: userData.permissions || ['manage_clients', 'view_analytics']
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSuperAdmins(): Promise<SuperAdmin[]> {
  const supabaseAdmin = createSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('super_admins')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// =============================================
// CLIENT TEMPLATE MANAGEMENT
// =============================================

export async function createClientTemplate(templateData: Omit<ClientTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ClientTemplate> {
  const supabaseAdmin = createSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('client_templates')
    .insert([templateData])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getClientTemplates(): Promise<ClientTemplate[]> {
  const supabaseAdmin = createSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('client_templates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateClientTemplate(id: string, updates: Partial<ClientTemplate>): Promise<ClientTemplate> {
  const supabaseAdmin = createSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('client_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// =============================================
// COMPANY MANAGEMENT (ENHANCED)
// =============================================

export async function createCompanyUser(userData: {
  company_id: string
  email: string
  password?: string
  full_name?: string
  role?: string
}) {
  const supabaseAdmin = createSupabaseAdmin()

  // 1. Create the user in auth.users
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true, // Auto-confirm the email
    user_metadata: {
      full_name: userData.full_name,
    },
  })

  if (authError) {
    console.error('Error creating auth user:', authError)
    throw new Error(`Failed to create auth user: ${authError.message}`)
  }
  
  const user = authData.user
  if (!user) {
    throw new Error('User was not created, but no error was reported.')
  }

  // 2. Create the user profile in user_profiles
  const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
    id: user.id,
    company_id: userData.company_id,
    email: userData.email,
    full_name: userData.full_name,
    role: userData.role || 'member',
  })

  if (profileError) {
    console.error('Error creating user profile:', profileError)
    // Clean up the created auth user if profile creation fails
    await supabaseAdmin.auth.admin.deleteUser(user.id)
    throw new Error(`Failed to create user profile: ${profileError.message}`)
  }

  return { success: true, userId: user.id }
}

export async function createCompanyWithTemplate(companyData: {
  name: string
  slug: string
  contact_email: string
  contact_phone?: string
  domain?: string
  template_id?: string
  plan?: string
  custom_config?: {
    dashboard_config?: Record<string, any>
    workspace_config?: Record<string, any>
    features?: string[]
  }
  created_by: string
}): Promise<any> {
  const supabaseAdmin = createSupabaseAdmin()

  // First, get the template if a template_id is provided
  let templateConfig: any = {
    dashboard_config: {},
    workspace_config: {},
    available_features: [],
    max_users: 10,
    max_contacts: 1000,
    max_api_calls: 10000,
  }

  if (companyData.template_id) {
    const { data: template, error } = await supabaseAdmin
      .from('client_templates')
      .select('*')
      .eq('id', companyData.template_id)
      .single()

    if (error) {
      console.error('Error fetching template:', error)
      throw new Error('Could not fetch the specified client template.')
    }
    if (template) {
      const validPlans = ['starter', 'professional', 'enterprise', 'custom'];
      const planFromTemplate = validPlans.includes(template.name) ? template.name : 'starter';

      templateConfig = {
        plan: planFromTemplate,
        dashboard_config: template.dashboard_config,
        workspace_config: template.workspace_config,
        available_features: template.available_features,
        max_users: template.max_users,
        max_contacts: template.max_contacts,
        max_api_calls: template.max_api_calls,
      }
    }
  }

  const newCompany = {
    name: companyData.name,
    slug: companyData.slug,
    contact_email: companyData.contact_email,
    contact_phone: companyData.contact_phone,
    domain: companyData.domain,
    template_id: companyData.template_id,
    plan: companyData.plan || templateConfig.plan || 'starter',
    status: 'active',
    dashboard_config: companyData.custom_config?.dashboard_config || templateConfig.dashboard_config,
    workspace_config: companyData.custom_config?.workspace_config || templateConfig.workspace_config,
    features: [...new Set(companyData.custom_config?.features || templateConfig.available_features || [])],
    created_by: companyData.created_by,
    max_users: templateConfig.max_users,
    max_contacts: templateConfig.max_contacts,
    max_api_calls: templateConfig.max_api_calls,
  }

  const { data: company, error: companyError } = await supabaseAdmin
    .from('companies')
    .insert(newCompany)
    .select()
    .single()

  if (companyError) {
    console.error('Error creating company:', companyError)
    throw new Error('Could not create company.')
  }
  
  const createdUsers = [];
  // Optionally create an initial user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: newCompany.contact_email,
    email_confirm: true,
  });

  if (authError) {
    console.warn(`Could not create initial user for ${newCompany.name}: ${authError.message}`);
  } else if (authData.user) {
    const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
      id: authData.user.id,
      company_id: company.id,
      email: newCompany.contact_email,
      role: 'owner',
    });
    if (profileError) {
      console.warn(`Could not create user profile for ${newCompany.name}: ${profileError.message}`);
    } else {
      createdUsers.push(authData.user);
    }
  }

  return { company: companyData, users: createdUsers }
}

export async function getAllCompanies(filters?: {
  status?: string
  plan?: string
  created_by?: string
}): Promise<any[]> {
  const supabaseAdmin = createSupabaseAdmin()
  let query = supabaseAdmin
    .from('companies')
    .select(`
      *,
      client_template:client_templates!companies_template_id_fkey (name)
    `)

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.plan) query = query.eq('plan', filters.plan)
  if (filters?.created_by) query = query.eq('created_by', filters.created_by)

  const { data, error } = await query.order('created_at', {
    ascending: false,
  })

  if (error) {
    console.error('Error fetching companies:', error)
    throw new Error('Could not fetch companies.')
  }
  return data || []
}

export async function updateCompanyConfiguration(companyId: string, updates: {
  dashboard_config?: Record<string, any>
  workspace_config?: Record<string, any>
  features?: string[]
  max_users?: number
  max_contacts?: number
  max_api_calls?: number
  plan?: string
  status?: string
}): Promise<any> {
  const supabaseAdmin = createSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('companies')
    .update(updates)
    .eq('id', companyId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getCompanyById(companyId: string): Promise<any> {
  const supabaseAdmin = createSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('*, client_template:client_templates(id, name)')
    .eq('id', companyId)
    .single()
  if (error) throw error
  return data
}

export async function getCompanyUsers(companyId: string): Promise<any[]> {
  const supabaseAdmin = createSupabaseAdmin()

  // Step 1: Fetch user profiles for the company
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, email, role, created_at')
    .eq('company_id', companyId)

  if (profilesError) {
    console.error('Error fetching user profiles:', profilesError)
    throw profilesError
  }

  if (!profiles || profiles.length === 0) {
    return []
  }

  // Step 2: Get user IDs to fetch auth data
  const userIds = profiles.map(p => p.id)
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000, // Adjust if you expect more users
  })
  
  if (authError) {
    console.error('Error fetching auth users:', authError)
    throw authError
  }

  // Create a map for quick lookups
  const authUsersMap = new Map(authUsers.users.map(u => [u.id, u]))

  // Step 3: Combine the data
  return profiles.map(profile => {
    const authUser = authUsersMap.get(profile.id)
    return {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: profile.role,
      last_login: authUser?.last_sign_in_at || profile.created_at,
      status: 'active', // Auth user status is more complex, using a placeholder
    }
  })
}

// =============================================
// API KEY & USAGE MANAGEMENT
// =============================================

export async function createCompanyApiKey(keyData: {
  company_id: string
  service: string
  key_name: string
  encrypted_key: string
  config?: Record<string, any>
  endpoints?: string[]
  rate_limits?: Record<string, any>
  monthly_limit_calls?: number
  monthly_limit_cost?: number
  created_by?: string
}): Promise<CompanyApiKey> {
  const supabaseAdmin = createSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('company_api_keys')
    .insert([keyData])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getCompanyApiKeys(companyId: string): Promise<CompanyApiKey[]> {
  const supabaseAdmin = createSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('company_api_keys')
    .select('*')
    .eq('company_id', companyId)
  if (error) throw error
  return data || []
}

export async function createUserApiKey(keyData: {
  user_id: string
  company_id: string
  service: string
  key_identifier: string
  encrypted_key: string
  monthly_limit_calls?: number
  monthly_limit_tokens?: number
  monthly_limit_cost?: number
}): Promise<UserApiKey> {
  const supabaseAdmin = createSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('user_api_keys')
    .insert([{
      ...keyData,
      status: 'active',
      current_month_reset: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
    }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getUserApiKeys(userId: string): Promise<UserApiKey[]> {
  const supabaseAdmin = createSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('user_api_keys')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data || []
}

export async function updateUserApiKeyLimits(keyId: string, limits: {
  monthly_limit_calls?: number
  monthly_limit_tokens?: number
  monthly_limit_cost?: number
}): Promise<UserApiKey> {
  const supabaseAdmin = createSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('user_api_keys')
    .update(limits)
    .eq('id', keyId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function logApiUsage(usageData: {
  company_id: string
  user_id?: string
  service: string
  endpoint?: string
  method?: string
  tokens_used?: number
  cost?: number
  response_time?: number
  status?: 'success' | 'error' | 'timeout' | 'rate_limited'
  ip_address?: string
  user_agent?: string
}): Promise<string> {
  const supabaseAdmin = createSupabaseAdmin()

  // 1. Log the individual usage event
  const { error: logError } = await supabaseAdmin
    .from('api_usage_logs')
    .insert([usageData])

  if (logError) {
    console.error('Error logging API usage:', logError)
    // Decide if you want to throw an error or just return
  }

  // 2. Update daily aggregate stats
  const today = new Date().toISOString().split('T')[0]
  const { error: upsertError } = await supabaseAdmin.rpc('update_daily_usage_stats', {
    p_date: today,
    p_company_id: usageData.company_id,
    p_user_id: usageData.user_id,
    p_service: usageData.service,
    p_calls_increment: 1,
    p_tokens_increment: usageData.tokens_used || 0,
    p_cost_increment: usageData.cost || 0,
    p_error_increment: usageData.status !== 'success' ? 1 : 0,
  })

  if (upsertError) {
    console.error('Error updating daily usage stats:', upsertError)
  }

  return 'Usage logged successfully'
}

export async function getCompanyUsageStats(companyId: string, filters?: {
  start_date?: string
  end_date?: string
  service?: string
  user_id?: string
}): Promise<{
  current_users: number
  current_contacts: number
  current_api_calls: number
  monthly_cost: number
  last_activity: string
}> {
  const supabaseAdmin = createSupabaseAdmin()
  
  // Get current user count
  const { count: userCount, error: userError } = await supabaseAdmin
    .from('user_profiles')
    .select('*', { count: 'exact' })
    .eq('company_id', companyId)
  
  if (userError) console.error("Error fetching user count:", userError)

  // Get current contact count (assuming a 'contacts' table)
  const contactCount = 0; // Placeholder

  // Get current month's API calls and cost
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
  const { data: usageData, error: usageError } = await supabaseAdmin
    .from('daily_usage_stats')
    .select('total_calls, total_cost')
    .eq('company_id', companyId)
    .gte('date', firstDayOfMonth)
    
  if (usageError) console.error("Error fetching usage data:", usageError)
    
  const monthlyCalls = usageData?.reduce((acc, row) => acc + row.total_calls, 0) || 0;
  const monthlyCost = usageData?.reduce((acc, row) => acc + row.total_cost, 0) || 0;

  // Get last activity
  const lastLog = { created_at: 'N/A' }; // Placeholder

  return {
    current_users: userCount || 0,
    current_contacts: contactCount || 0,
    current_api_calls: monthlyCalls,
    monthly_cost: monthlyCost,
    last_activity: lastLog?.created_at || 'N/A'
  }
}

export async function getUserUsageStats(userId: string, filters?: {
  start_date?: string
  end_date?: string
  service?: string
}): Promise<DailyUsageStats[]> {
  const supabaseAdmin = createSupabaseAdmin()
  let query = supabaseAdmin
    .from('daily_usage_stats')
    .select('*')
    .eq('user_id', userId)

  if (filters?.start_date) query = query.gte('date', filters.start_date)
  if (filters?.end_date) query = query.lte('date', filters.end_date)
  if (filters?.service) query = query.eq('service', filters.service)

  const { data, error } = await query.order('date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getCompanyCostSummary(companyId: string, month?: string): Promise<{
  total_cost: number
  api_costs: number
  llm_costs: number
  total_calls: number
  total_tokens: number
  cost_by_service: Record<string, number>
  cost_by_user: Record<string, number>
}> {
  const supabaseAdmin = createSupabaseAdmin()
  const targetMonth = month || new Date().toISOString().slice(0, 7) // YYYY-MM format
  const startDate = `${targetMonth}-01`
  const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)).toISOString().slice(0, 10)

  const { data, error } = await supabaseAdmin
    .from('daily_usage_stats')
    .select('*')
    .eq('company_id', companyId)
    .gte('date', startDate)
    .lt('date', endDate)

  if (error) {
    console.error('Error fetching cost summary:', error)
    throw error
  }

  const summary = {
    total_cost: 0,
    api_costs: 0,
    llm_costs: 0,
    total_calls: 0,
    total_tokens: 0,
    cost_by_service: {} as Record<string, number>,
    cost_by_user: {} as Record<string, number>,
  }

  if (!data) return summary

  for (const row of data) {
    summary.total_cost += row.total_cost
    summary.total_calls += row.total_calls
    summary.total_tokens += row.total_tokens

    if (row.service.includes('llm') || row.service.includes('openai')) {
      summary.llm_costs += row.total_cost
    } else {
      summary.api_costs += row.total_cost
    }

    if (row.service) {
      summary.cost_by_service[row.service] = (summary.cost_by_service[row.service] || 0) + row.total_cost
    }
    if (row.user_id) {
      summary.cost_by_user[row.user_id] = (summary.cost_by_user[row.user_id] || 0) + row.total_cost
    }
  }

  return summary
}

// =============================================
// DASHBOARD & CONFIGURATION
// =============================================

export async function createDashboardComponent(componentData: {
  name: string
  component_key: string
  description?: string
  category?: string
  default_config?: Record<string, any>
  required_permissions?: string[]
  required_features?: string[]
  is_premium?: boolean
  monthly_cost?: number
}): Promise<any> {
  const supabaseAdmin = createSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('dashboard_components')
    .insert([componentData])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getAvailableDashboardComponents(): Promise<any[]> {
  const supabaseAdmin = createSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('dashboard_components')
    .select('*')
  if (error) throw error
  return data || []
}

export async function updateCompanyDashboardLayout(companyId: string, layoutData: {
  layout_name?: string
  components: Record<string, any>
  grid_layout?: Record<string, any>
  allowed_roles?: string[]
}): Promise<any> {
  const supabaseAdmin = createSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('companies')
    .update({
      dashboard_config: {
        ...(layoutData.layout_name ? { layout_name: layoutData.layout_name } : {}),
        components: layoutData.components,
        grid_layout: layoutData.grid_layout,
        allowed_roles: layoutData.allowed_roles
      }
    })
    .eq('id', companyId)
    .select('dashboard_config')
    .single()

  if (error) throw error
  return data.dashboard_config
}

// =============================================
// ALERTING & NOTIFICATIONS
// =============================================
export async function createCostAlert(alertData: {
  company_id?: string
  user_id?: string
  alert_type: 'monthly_limit' | 'daily_limit' | 'api_cost' | 'llm_cost'
  threshold_amount?: number
  threshold_percentage?: number
  notify_email?: boolean
  notify_slack?: boolean
  notify_dashboard?: boolean
}): Promise<any> {
  const supabaseAdmin = createSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('cost_alerts')
    .insert([alertData])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function checkCostAlerts(companyId: string): Promise<any[]> {
  const supabaseAdmin = createSupabaseAdmin()

  // 1. Get all active alerts for the company
  const { data: alerts, error: alertsError } = await supabaseAdmin
    .from('cost_alerts')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
  
  if (alertsError) throw alertsError
  if (!alerts || alerts.length === 0) return []

  // 2. Get current monthly usage stats
  const costSummary = await getCompanyCostSummary(companyId)

  const triggeredAlerts = []

  for (const alert of alerts) {
    let isTriggered = false
    let message = ''

    switch (alert.alert_type) {
      case 'monthly_limit':
        if (alert.threshold_amount && costSummary.total_cost > alert.threshold_amount) {
          isTriggered = true
          message = `Monthly cost limit of $${alert.threshold_amount} exceeded. Current cost: $${costSummary.total_cost.toFixed(2)}.`
        }
        break
      case 'api_cost':
         if (alert.threshold_amount && costSummary.api_costs > alert.threshold_amount) {
          isTriggered = true
          message = `API cost limit of $${alert.threshold_amount} exceeded. Current API cost: $${costSummary.api_costs.toFixed(2)}.`
        }
        break
      case 'llm_cost':
         if (alert.threshold_amount && costSummary.llm_costs > alert.threshold_amount) {
          isTriggered = true
          message = `LLM cost limit of $${alert.threshold_amount} exceeded. Current LLM cost: $${costSummary.llm_costs.toFixed(2)}.`
        }
        break;
      // Add more cases for daily limits, percentages, etc.
    }
    
    if (isTriggered) {
      triggeredAlerts.push({ alert, message })
      // Here you would trigger notifications (e.g., send an email, post to Slack)
    }
  }

  return triggeredAlerts
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

export function encryptApiKey(apiKey: string): string {
  // In a real app, use a robust encryption library like `crypto`
  return Buffer.from(apiKey).toString('base64')
}

export function decryptApiKey(encryptedKey: string): string {
  // In a real app, use a robust encryption library like `crypto`
  return Buffer.from(encryptedKey, 'base64').toString('utf-8')
}

export async function deleteUser(id: string) {
  const supabaseAdmin = createSupabaseAdmin()

  // First, delete from the public.users table (user_profiles)
  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .delete()
    .eq('id', id)

  if (profileError) {
    console.error('Error deleting user profile:', profileError)
    // Don't throw immediately, still attempt to delete auth user if profile is missing
  }

  // Then, delete the user from auth.users
  // This is the definitive action. If this fails, the user still exists.
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)

  if (authError) {
    console.error('Error deleting auth user:', authError)
    throw new Error('No se pudo eliminar el usuario del sistema de autenticación.')
  }

  return { success: true }
}

export async function getAllTemplates(): Promise<any[]> {
  const supabaseAdmin = createSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('client_templates')
    .select('*')

  if (error) throw error
  return data || []
}

export async function createTemplate(template: {
  name: string
  content: object
}) {
  const supabaseAdmin = createSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('client_templates')
    .insert([template])
    .select()

  if (error) {
    console.error('Error creating template:', error)
    throw new Error('Could not create template.')
  }

  return data[0]
}

export async function updateTemplate(
  id: string,
  updates: { name?: string; content?: object }
) {
  const supabaseAdmin = createSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('client_templates')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating template:', error)
    throw new Error('Could not update template.')
  }
  return data[0]
}

export async function deleteTemplate(id: string) {
  const supabaseAdmin = createSupabaseAdmin()
  const { error } = await supabaseAdmin
    .from('client_templates')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting template:', error)
    throw new Error('Could not delete template.')
  }

  return { success: true }
}

export async function updateUser(
  userId: string,
  updates: {
    full_name?: string
    role?: string
  }
) {
  const supabaseAdmin = createSupabaseAdmin()

  const profileUpdates: { full_name?: string; role?: string } = {}
  if (updates.full_name) profileUpdates.full_name = updates.full_name
  if (updates.role) profileUpdates.role = updates.role

  if (Object.keys(profileUpdates).length > 0) {
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update(profileUpdates)
      .eq('id', userId)

    if (profileError) {
      console.error('Error updating user profile:', profileError)
      throw new Error('No se pudo actualizar el perfil del usuario.')
    }
  }

  // Also update the full_name in the auth user metadata
  if (updates.full_name) {
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { full_name: updates.full_name },
    })
  }

  return { success: true }
}