import { Suspense } from 'react';
import { getCurrentCompany, getAvailableModules } from '@/lib/crm-multitenant';
import { WorkspaceLayoutWithProvider } from '../workspace-layout-with-provider';

interface WorkspacePageWrapperProps {
  children: React.ReactNode;
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function WorkspacePageWrapper({ children, searchParams }: WorkspacePageWrapperProps) {
  const params = await searchParams;
  const companyId = params?.company_id as string | undefined;

  let initialCompanyData = null;
  let fetchError: string | null = null;
  let availableModules: any[] = [];

  try {
    // Use Promise.allSettled to ensure both requests are attempted
    const [companyResult, modulesResult] = await Promise.allSettled([
      companyId ? getCurrentCompany(companyId) : Promise.resolve(null),
      getAvailableModules(),
    ]);

    // Process modules result
    if (modulesResult.status === 'fulfilled') {
      availableModules = modulesResult.value;
    } else {
      console.error("Critical: Failed to fetch modules.", modulesResult.reason);
      // We might want to throw or set a specific error if modules are critical
    }

    // Process company result
    if (companyId) {
      if (companyResult.status === 'fulfilled' && companyResult.value) {
        initialCompanyData = companyResult.value;
      } else {
        // If getCurrentCompany threw an error, use its message
        const reason = (companyResult as PromiseRejectedResult).reason;
        throw reason || new Error('Failed to fetch company data.');
      }
    } else {
      fetchError = "No se proporcionó un ID de compañía en la URL.";
    }
  } catch (error: any) {
    console.error(`[WorkspacePageWrapper] Failed to fetch data:`, error.message);
    fetchError = error.message || 'An unknown error occurred on the server.';
  }

  return (
    <WorkspaceLayoutWithProvider
      initialCompanyData={initialCompanyData}
      fetchError={fetchError}
      availableModules={availableModules}
    >
      {children}
    </WorkspaceLayoutWithProvider>
  );
} 