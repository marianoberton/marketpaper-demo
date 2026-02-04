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

// Jerarquía de roles ordenada de mayor a menor privilegio
export const ROLE_HIERARCHY: UserRole[] = [
  'super_admin',
  'company_owner',
  'company_admin',
  'manager',
  'employee',
  'viewer'
]

// ============================================
// Helper Functions (Pure - No DB dependencies)
// ============================================

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

/**
 * Verifica si un rol tiene todos los permisos especificados
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p))
}

/**
 * Verifica si un rol tiene al menos uno de los permisos especificados
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}

/**
 * Obtiene el índice de un rol en la jerarquía (menor = más privilegios)
 */
export function getRoleHierarchyIndex(role: UserRole): number {
  const index = ROLE_HIERARCHY.indexOf(role)
  return index === -1 ? ROLE_HIERARCHY.length : index
}

/**
 * Compara dos roles y retorna si el primero tiene mayor o igual privilegio
 */
export function isRoleEqualOrHigher(role: UserRole, thanRole: UserRole): boolean {
  return getRoleHierarchyIndex(role) <= getRoleHierarchyIndex(thanRole)
}

/**
 * Verifica si un rol puede gestionar a otro rol
 * (un rol solo puede gestionar roles inferiores)
 */
export function canManageRole(actorRole: UserRole, targetRole: UserRole): boolean {
  const actorIndex = getRoleHierarchyIndex(actorRole)
  const targetIndex = getRoleHierarchyIndex(targetRole)
  return actorIndex < targetIndex
}

/**
 * Verifica si es super admin
 */
export function isSuperAdminRole(role: UserRole): boolean {
  return role === 'super_admin'
}

/**
 * Verifica si es un rol con acceso admin (company_admin o superior)
 */
export function isAdminRole(role: UserRole): boolean {
  return hasPermission(role, 'admin_access')
}

/**
 * Verifica si un usuario tiene acceso a un recurso basado en company_id
 * Super admin tiene acceso a todo
 */
export function hasCompanyAccess(
  userRole: UserRole,
  userCompanyId: string | null | undefined,
  resourceCompanyId: string | null | undefined
): boolean {
  if (isSuperAdminRole(userRole)) return true
  if (!userCompanyId || !resourceCompanyId) return false
  return userCompanyId === resourceCompanyId
}

/**
 * Verifica acceso a un ticket
 * - Super admin: acceso total
 * - Creador del ticket: acceso
 * - Usuario de la misma empresa: acceso
 */
export function hasTicketAccess(
  userRole: UserRole,
  userId: string,
  userCompanyId: string | null | undefined,
  ticketUserId: string,
  ticketCompanyId: string | null | undefined
): boolean {
  // Super admin tiene acceso total
  if (isSuperAdminRole(userRole)) return true

  // Creador del ticket tiene acceso
  if (userId === ticketUserId) return true

  // Usuarios de la misma empresa tienen acceso
  if (userCompanyId && ticketCompanyId && userCompanyId === ticketCompanyId) {
    return true
  }

  return false
}

/**
 * Obtiene los roles que un usuario puede asignar
 * (solo puede asignar roles inferiores al suyo)
 */
export function getAssignableRoles(actorRole: UserRole): UserRole[] {
  const actorIndex = getRoleHierarchyIndex(actorRole)
  return ROLE_HIERARCHY.filter((_, index) => index > actorIndex)
} 