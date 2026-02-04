import { describe, it, expect } from 'vitest'
import {
  ROLE_PERMISSIONS,
  ROLE_HIERARCHY,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getRoleHierarchyIndex,
  isRoleEqualOrHigher,
  canManageRole,
  isSuperAdminRole,
  isAdminRole,
  hasCompanyAccess,
  hasTicketAccess,
  getAssignableRoles,
  type UserRole
} from '../auth-types'

describe('Auth Types Module', () => {
  describe('ROLE_PERMISSIONS', () => {
    const allRoles: UserRole[] = [
      'super_admin',
      'company_owner',
      'company_admin',
      'manager',
      'employee',
      'viewer',
    ]

    it('should define permissions for all roles', () => {
      allRoles.forEach((role) => {
        expect(ROLE_PERMISSIONS[role]).toBeDefined()
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true)
      })
    })

    describe('Role Hierarchy', () => {
      it('super_admin should have all permissions including super_admin_access', () => {
        const superAdminPerms = ROLE_PERMISSIONS.super_admin

        expect(superAdminPerms).toContain('read')
        expect(superAdminPerms).toContain('write')
        expect(superAdminPerms).toContain('delete')
        expect(superAdminPerms).toContain('manage_users')
        expect(superAdminPerms).toContain('manage_company')
        expect(superAdminPerms).toContain('manage_projects')
        expect(superAdminPerms).toContain('manage_clients')
        expect(superAdminPerms).toContain('view_reports')
        expect(superAdminPerms).toContain('manage_billing')
        expect(superAdminPerms).toContain('admin_access')
        expect(superAdminPerms).toContain('super_admin_access')
      })

      it('company_owner should have all permissions except super_admin_access', () => {
        const ownerPerms = ROLE_PERMISSIONS.company_owner

        expect(ownerPerms).toContain('read')
        expect(ownerPerms).toContain('write')
        expect(ownerPerms).toContain('delete')
        expect(ownerPerms).toContain('manage_users')
        expect(ownerPerms).toContain('manage_company')
        expect(ownerPerms).toContain('manage_billing')
        expect(ownerPerms).toContain('admin_access')
        expect(ownerPerms).not.toContain('super_admin_access')
      })

      it('company_admin should not have manage_company or manage_billing', () => {
        const adminPerms = ROLE_PERMISSIONS.company_admin

        expect(adminPerms).toContain('read')
        expect(adminPerms).toContain('write')
        expect(adminPerms).toContain('delete')
        expect(adminPerms).toContain('manage_users')
        expect(adminPerms).toContain('admin_access')
        expect(adminPerms).not.toContain('manage_company')
        expect(adminPerms).not.toContain('manage_billing')
        expect(adminPerms).not.toContain('super_admin_access')
      })

      it('manager should not have delete or manage_users', () => {
        const managerPerms = ROLE_PERMISSIONS.manager

        expect(managerPerms).toContain('read')
        expect(managerPerms).toContain('write')
        expect(managerPerms).toContain('manage_projects')
        expect(managerPerms).toContain('manage_clients')
        expect(managerPerms).toContain('view_reports')
        expect(managerPerms).not.toContain('delete')
        expect(managerPerms).not.toContain('manage_users')
        expect(managerPerms).not.toContain('admin_access')
      })

      it('employee should have limited permissions', () => {
        const employeePerms = ROLE_PERMISSIONS.employee

        expect(employeePerms).toContain('read')
        expect(employeePerms).toContain('write')
        expect(employeePerms).toContain('manage_projects')
        expect(employeePerms).toContain('manage_clients')
        expect(employeePerms).not.toContain('delete')
        expect(employeePerms).not.toContain('view_reports')
        expect(employeePerms).not.toContain('manage_users')
        expect(employeePerms).not.toContain('admin_access')
      })

      it('viewer should only have read and view_reports', () => {
        const viewerPerms = ROLE_PERMISSIONS.viewer

        expect(viewerPerms).toContain('read')
        expect(viewerPerms).toContain('view_reports')
        expect(viewerPerms).not.toContain('write')
        expect(viewerPerms).not.toContain('delete')
        expect(viewerPerms).not.toContain('manage_users')
        expect(viewerPerms).not.toContain('manage_projects')
        expect(viewerPerms).not.toContain('manage_clients')
        expect(viewerPerms).not.toContain('admin_access')
        expect(viewerPerms.length).toBe(2)
      })
    })

    describe('Permission inheritance', () => {
      it('higher roles should have more permissions than lower roles', () => {
        const superAdminCount = ROLE_PERMISSIONS.super_admin.length
        const ownerCount = ROLE_PERMISSIONS.company_owner.length
        const adminCount = ROLE_PERMISSIONS.company_admin.length
        const managerCount = ROLE_PERMISSIONS.manager.length
        const employeeCount = ROLE_PERMISSIONS.employee.length
        const viewerCount = ROLE_PERMISSIONS.viewer.length

        expect(superAdminCount).toBeGreaterThan(ownerCount)
        expect(ownerCount).toBeGreaterThan(adminCount)
        expect(adminCount).toBeGreaterThan(managerCount)
        expect(managerCount).toBeGreaterThan(employeeCount)
        expect(employeeCount).toBeGreaterThan(viewerCount)
      })

      it('all non-viewer roles should have read and write', () => {
        const rolesWithWrite: UserRole[] = [
          'super_admin',
          'company_owner',
          'company_admin',
          'manager',
          'employee',
        ]

        rolesWithWrite.forEach((role) => {
          expect(ROLE_PERMISSIONS[role]).toContain('read')
          expect(ROLE_PERMISSIONS[role]).toContain('write')
        })
      })

      it('only admin-level roles should have admin_access', () => {
        const adminRoles: UserRole[] = ['super_admin', 'company_owner', 'company_admin']
        const nonAdminRoles: UserRole[] = ['manager', 'employee', 'viewer']

        adminRoles.forEach((role) => {
          expect(ROLE_PERMISSIONS[role]).toContain('admin_access')
        })

        nonAdminRoles.forEach((role) => {
          expect(ROLE_PERMISSIONS[role]).not.toContain('admin_access')
        })
      })

      it('only super_admin should have super_admin_access', () => {
        expect(ROLE_PERMISSIONS.super_admin).toContain('super_admin_access')

        const nonSuperRoles: UserRole[] = [
          'company_owner',
          'company_admin',
          'manager',
          'employee',
          'viewer',
        ]

        nonSuperRoles.forEach((role) => {
          expect(ROLE_PERMISSIONS[role]).not.toContain('super_admin_access')
        })
      })
    })
  })

  describe('hasPermission', () => {
    it('should return true for valid permissions', () => {
      expect(hasPermission('super_admin', 'read')).toBe(true)
      expect(hasPermission('super_admin', 'super_admin_access')).toBe(true)
      expect(hasPermission('company_owner', 'manage_billing')).toBe(true)
      expect(hasPermission('viewer', 'read')).toBe(true)
    })

    it('should return false for invalid permissions', () => {
      expect(hasPermission('viewer', 'write')).toBe(false)
      expect(hasPermission('employee', 'delete')).toBe(false)
      expect(hasPermission('manager', 'manage_users')).toBe(false)
      expect(hasPermission('company_admin', 'super_admin_access')).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('should return true when role has all permissions', () => {
      expect(hasAllPermissions('super_admin', ['read', 'write', 'delete'])).toBe(true)
      expect(hasAllPermissions('company_owner', ['read', 'admin_access'])).toBe(true)
    })

    it('should return false when role lacks any permission', () => {
      expect(hasAllPermissions('viewer', ['read', 'write'])).toBe(false)
      expect(hasAllPermissions('employee', ['read', 'delete'])).toBe(false)
    })

    it('should return true for empty permission array', () => {
      expect(hasAllPermissions('viewer', [])).toBe(true)
    })
  })

  describe('hasAnyPermission', () => {
    it('should return true when role has at least one permission', () => {
      expect(hasAnyPermission('viewer', ['read', 'write'])).toBe(true)
      expect(hasAnyPermission('employee', ['delete', 'write'])).toBe(true)
    })

    it('should return false when role has none of the permissions', () => {
      expect(hasAnyPermission('viewer', ['write', 'delete'])).toBe(false)
      expect(hasAnyPermission('employee', ['delete', 'manage_users'])).toBe(false)
    })

    it('should return false for empty permission array', () => {
      expect(hasAnyPermission('super_admin', [])).toBe(false)
    })
  })

  describe('getRoleHierarchyIndex', () => {
    it('should return correct index for each role', () => {
      expect(getRoleHierarchyIndex('super_admin')).toBe(0)
      expect(getRoleHierarchyIndex('company_owner')).toBe(1)
      expect(getRoleHierarchyIndex('company_admin')).toBe(2)
      expect(getRoleHierarchyIndex('manager')).toBe(3)
      expect(getRoleHierarchyIndex('employee')).toBe(4)
      expect(getRoleHierarchyIndex('viewer')).toBe(5)
    })
  })

  describe('isRoleEqualOrHigher', () => {
    it('should return true for same role', () => {
      expect(isRoleEqualOrHigher('manager', 'manager')).toBe(true)
      expect(isRoleEqualOrHigher('viewer', 'viewer')).toBe(true)
    })

    it('should return true for higher role', () => {
      expect(isRoleEqualOrHigher('super_admin', 'viewer')).toBe(true)
      expect(isRoleEqualOrHigher('company_owner', 'employee')).toBe(true)
      expect(isRoleEqualOrHigher('manager', 'viewer')).toBe(true)
    })

    it('should return false for lower role', () => {
      expect(isRoleEqualOrHigher('viewer', 'super_admin')).toBe(false)
      expect(isRoleEqualOrHigher('employee', 'manager')).toBe(false)
    })
  })

  describe('canManageRole', () => {
    it('should allow super_admin to manage everyone', () => {
      expect(canManageRole('super_admin', 'company_owner')).toBe(true)
      expect(canManageRole('super_admin', 'viewer')).toBe(true)
    })

    it('should allow company_owner to manage admin and below', () => {
      expect(canManageRole('company_owner', 'company_admin')).toBe(true)
      expect(canManageRole('company_owner', 'super_admin')).toBe(false)
    })

    it('should allow manager to manage employee and viewer', () => {
      expect(canManageRole('manager', 'employee')).toBe(true)
      expect(canManageRole('manager', 'viewer')).toBe(true)
      expect(canManageRole('manager', 'company_admin')).toBe(false)
    })

    it('should not allow viewer to manage anyone', () => {
      expect(canManageRole('viewer', 'employee')).toBe(false)
      expect(canManageRole('viewer', 'viewer')).toBe(false)
    })

    it('should not allow same role to manage itself', () => {
      ROLE_HIERARCHY.forEach((role) => {
        expect(canManageRole(role, role)).toBe(false)
      })
    })
  })

  describe('isSuperAdminRole', () => {
    it('should return true only for super_admin', () => {
      expect(isSuperAdminRole('super_admin')).toBe(true)
      expect(isSuperAdminRole('company_owner')).toBe(false)
      expect(isSuperAdminRole('viewer')).toBe(false)
    })
  })

  describe('isAdminRole', () => {
    it('should return true for roles with admin_access', () => {
      expect(isAdminRole('super_admin')).toBe(true)
      expect(isAdminRole('company_owner')).toBe(true)
      expect(isAdminRole('company_admin')).toBe(true)
    })

    it('should return false for non-admin roles', () => {
      expect(isAdminRole('manager')).toBe(false)
      expect(isAdminRole('employee')).toBe(false)
      expect(isAdminRole('viewer')).toBe(false)
    })
  })

  describe('hasCompanyAccess', () => {
    const companyA = 'company-a-uuid'
    const companyB = 'company-b-uuid'

    it('should allow super_admin access to any company', () => {
      expect(hasCompanyAccess('super_admin', null, companyA)).toBe(true)
      expect(hasCompanyAccess('super_admin', companyA, companyB)).toBe(true)
    })

    it('should allow access when companies match', () => {
      expect(hasCompanyAccess('employee', companyA, companyA)).toBe(true)
      expect(hasCompanyAccess('viewer', companyA, companyA)).toBe(true)
    })

    it('should deny access when companies do not match', () => {
      expect(hasCompanyAccess('company_owner', companyA, companyB)).toBe(false)
      expect(hasCompanyAccess('employee', companyA, companyB)).toBe(false)
    })

    it('should deny access when company_id is null/undefined', () => {
      expect(hasCompanyAccess('employee', null, companyA)).toBe(false)
      expect(hasCompanyAccess('employee', companyA, null)).toBe(false)
      expect(hasCompanyAccess('employee', undefined, companyA)).toBe(false)
    })
  })

  describe('hasTicketAccess', () => {
    const userId = 'user-1'
    const otherUserId = 'user-2'
    const companyA = 'company-a'
    const companyB = 'company-b'

    it('should allow super_admin access to any ticket', () => {
      expect(hasTicketAccess('super_admin', userId, null, otherUserId, companyB)).toBe(true)
    })

    it('should allow ticket creator access', () => {
      expect(hasTicketAccess('employee', userId, companyA, userId, companyA)).toBe(true)
      expect(hasTicketAccess('viewer', userId, companyA, userId, companyB)).toBe(true)
    })

    it('should allow same company users access', () => {
      expect(hasTicketAccess('employee', userId, companyA, otherUserId, companyA)).toBe(true)
      expect(hasTicketAccess('manager', userId, companyA, otherUserId, companyA)).toBe(true)
    })

    it('should deny access to tickets from other companies', () => {
      expect(hasTicketAccess('employee', userId, companyA, otherUserId, companyB)).toBe(false)
      expect(hasTicketAccess('company_owner', userId, companyA, otherUserId, companyB)).toBe(false)
    })

    it('should deny access when company_id is missing', () => {
      expect(hasTicketAccess('employee', userId, null, otherUserId, companyA)).toBe(false)
      expect(hasTicketAccess('employee', userId, companyA, otherUserId, null)).toBe(false)
    })
  })

  describe('getAssignableRoles', () => {
    it('super_admin can assign all roles except super_admin', () => {
      const assignable = getAssignableRoles('super_admin')
      expect(assignable).toEqual(['company_owner', 'company_admin', 'manager', 'employee', 'viewer'])
      expect(assignable).not.toContain('super_admin')
    })

    it('company_owner can assign admin and below', () => {
      const assignable = getAssignableRoles('company_owner')
      expect(assignable).toEqual(['company_admin', 'manager', 'employee', 'viewer'])
    })

    it('manager can assign employee and viewer', () => {
      const assignable = getAssignableRoles('manager')
      expect(assignable).toEqual(['employee', 'viewer'])
    })

    it('viewer cannot assign any roles', () => {
      const assignable = getAssignableRoles('viewer')
      expect(assignable).toEqual([])
    })
  })
})
