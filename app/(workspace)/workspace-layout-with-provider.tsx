'use client'

import { WorkspaceLayout } from '@/components/workspace-layout'
import { WorkspaceProvider, useIsSuperAdmin } from '@/components/workspace-context'

interface Company {
  id: string
  name: string
  features: string[]
  logo_url?: string
}

interface WorkspaceLayoutWithProviderProps {
  children: React.ReactNode
  initialCompanyData: Company | null
  fetchError?: string | null
  availableModules?: any[]
}

// Componente interno que usa el hook de super admin
function WorkspaceLayoutWithSuperAdminCheck({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, loading } = useIsSuperAdmin()
  
  // Mientras carga, no mostrar el back link por seguridad
  const showBackLink = !loading && isSuperAdmin
  
  return (
    <WorkspaceLayout showBackLink={showBackLink}>
      {children}
    </WorkspaceLayout>
  )
}

export function WorkspaceLayoutWithProvider({ 
  children,
  initialCompanyData,
  fetchError,
  availableModules
}: WorkspaceLayoutWithProviderProps) {

  if (fetchError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="rounded-lg border border-red-500 bg-white p-6 text-center shadow-lg dark:bg-gray-800">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Error al Cargar el Workspace</h2>
          <p className="mt-2 text-gray-700 dark:text-gray-300">No se pudieron obtener los datos del servidor.</p>
          <pre className="mt-4 whitespace-pre-wrap rounded-md bg-red-50 p-3 text-left text-sm text-red-900 dark:bg-red-900/20 dark:text-red-200">
            <strong>Razón del error:</strong> {fetchError}
          </pre>
        </div>
      </div>
    )
  }
  
  const companyFeatures = initialCompanyData?.features || []
  const companyName = initialCompanyData?.name
  const companyId = initialCompanyData?.id
  const companyLogoUrl = initialCompanyData?.logo_url
  const isLoading = !initialCompanyData; // True if no data was passed from server

  return (
    <WorkspaceProvider 
      companyFeatures={companyFeatures}
      companyId={companyId}
      companyName={companyName}
      companyLogoUrl={companyLogoUrl}
      isLoading={isLoading}
      availableModules={availableModules || []}
    >
      <WorkspaceLayoutWithSuperAdminCheck>
        {children}
      </WorkspaceLayoutWithSuperAdminCheck>
    </WorkspaceProvider>
  )
} 