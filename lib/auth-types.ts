// Definir tipos de usuarios
export type UserRole = 'super_admin' | 'company_owner' | 'company_admin' | 'manager' | 'employee' | 'viewer'

export type Permission = 
  | 'read' | 'write' | 'delete' 
  | 'manage_users' | 'manage_company' | 'manage_projects' | 'manage_clients'
  | 'view_reports' | 'manage_billing' | 'admin_access' | 'super_admin_access'

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  company_id?: string
  role: UserRole
  permissions: Permission[]
  status: 'active' | 'inactive' | 'pending'
  last_login?: string
  preferences: Record<string, any>
  timezone: string
  locale: string
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
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
  created_at: string
  updated_at: string
}

// Permisos por rol
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'read', 'write', 'delete', 'manage_users', 'manage_company', 
    'manage_projects', 'manage_clients', 'view_reports', 'manage_billing', 
    'admin_access', 'super_admin_access'
  ],
  company_owner: [
    'read', 'write', 'delete', 'manage_users', 'manage_company', 
    'manage_projects', 'manage_clients', 'view_reports', 'manage_billing', 
    'admin_access'
  ],
  company_admin: [
    'read', 'write', 'delete', 'manage_users', 'manage_projects', 
    'manage_clients', 'view_reports', 'admin_access'
  ],
  manager: [
    'read', 'write', 'manage_projects', 'manage_clients', 'view_reports'
  ],
  employee: [
    'read', 'write', 'manage_projects', 'manage_clients'
  ],
  viewer: [
    'read', 'view_reports'
  ]
} 