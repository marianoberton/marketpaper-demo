'use client'

import React, { createContext, useContext, ReactNode } from 'react'

interface WorkspaceContextProps {
  companyFeatures: string[]
  companyId?: string
  companyName?: string
  isLoading: boolean
  availableModules: any[]
}

const WorkspaceContext = createContext<WorkspaceContextProps | undefined>(undefined)

export function WorkspaceProvider({ 
  children,
  companyFeatures,
  companyId,
  companyName,
  isLoading,
  availableModules,
} : { 
  children: ReactNode
  companyFeatures: string[]
  companyId?: string
  companyName?: string
  isLoading: boolean
  availableModules: any[]
}) {
  const value = { 
    companyFeatures,
    companyId,
    companyName,
    isLoading,
    availableModules,
  }
  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  
  // Si no hay contexto, devolver valores por defecto en lugar de error
  if (context === undefined) {
    return {
      companyFeatures: [],
      companyId: undefined,
      companyName: undefined,
      isLoading: false,
      availableModules: []
    }
  }
  
  return context
} 