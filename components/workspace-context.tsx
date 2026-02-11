'use client'

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getCurrentUserClient } from '@/lib/auth-client'

interface WorkspaceContextProps {
  companyFeatures: string[]
  companyId?: string
  companyName?: string
  companyLogoUrl?: string
  clientPortalEnabled?: boolean
  isLoading: boolean
  availableModules: any[]
  // User information
  userName?: string
  userEmail?: string
  userRole?: string
  userGender?: string
  userPosition?: string
  userDepartment?: string
}

const WorkspaceContext = createContext<WorkspaceContextProps | undefined>(undefined)

export function WorkspaceProvider({
  children,
  companyFeatures,
  companyId,
  companyName,
  companyLogoUrl,
  clientPortalEnabled,
  isLoading,
  availableModules,
}: {
  children: ReactNode
  companyFeatures: string[]
  companyId?: string
  companyName?: string
  companyLogoUrl?: string
  clientPortalEnabled?: boolean
  isLoading: boolean
  availableModules: any[]
}) {
  const [userName, setUserName] = useState<string>()
  const [userEmail, setUserEmail] = useState<string>()
  const [userRole, setUserRole] = useState<string>()
  const [userGender, setUserGender] = useState<string>()
  const [userPosition, setUserPosition] = useState<string>()
  const [userDepartment, setUserDepartment] = useState<string>()

  // Debug: Log received props
  useEffect(() => {
    console.log('[WorkspaceProvider] Received props:', {
      companyId,
      companyName,
      companyFeatures,
      isLoading,
      availableModules: availableModules?.length
    });
  }, [companyId, companyName, companyFeatures, isLoading, availableModules]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getCurrentUserClient()
        if (user) {
          setUserName(user.full_name || user.email || 'Usuario')
          setUserEmail(user.email)
          setUserRole(user.role)
          setUserGender(user.gender)
          setUserPosition(user.position)
          setUserDepartment(user.department)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }

    loadUserData()
  }, [])

  const value = {
    companyFeatures,
    companyId,
    companyName,
    companyLogoUrl,
    clientPortalEnabled,
    isLoading,
    availableModules,
    userName,
    userEmail,
    userRole,
    userGender,
    userPosition,
    userDepartment,
  }
  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}

// Hook para verificar si el usuario actual es super admin
export function useIsSuperAdmin() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setIsSuperAdmin(false)
          setLoading(false)
          return
        }

        const { data: superAdmin } = await supabase
          .from('super_admins')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (superAdmin) {
          setIsSuperAdmin(true)
          return
        }

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        setIsSuperAdmin(profile?.role === 'super_admin')
      } catch (error) {
        console.error('Error checking super admin status:', error)
        setIsSuperAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkSuperAdmin()
  }, [])

  return { isSuperAdmin, loading }
}