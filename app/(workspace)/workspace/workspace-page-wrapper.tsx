import { Suspense } from 'react';
import { getCurrentCompany, getModulesForCompany } from '@/lib/crm-multitenant';
import { WorkspaceLayoutWithProvider } from '../workspace-layout-with-provider';

interface WorkspacePageWrapperProps {
  children: React.ReactNode;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function WorkspacePageWrapper({ children, searchParams }: WorkspacePageWrapperProps) {
  const params = await searchParams;
  const companyId = params?.company_id as string | undefined;

  let initialCompanyData = null;
  let fetchError: string | null = null;
  let availableModules: any[] = [];

  try {
    if (!companyId) {
      fetchError = "No se proporcionó un ID de compañía en la URL.";
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

    // Use Promise.allSettled to ensure both requests are attempted
    const [companyResult, modulesResult] = await Promise.allSettled([
      getCurrentCompany(companyId),
      getModulesForCompany(companyId), // Now using company-specific modules
    ]);

    // Process company result
    if (companyResult.status === 'fulfilled' && companyResult.value) {
      initialCompanyData = companyResult.value;
    } else {
      // If getCurrentCompany threw an error, use its message
      const reason = (companyResult as PromiseRejectedResult).reason;
      throw reason || new Error('Failed to fetch company data.');
    }

    // Process modules result - now specific to the company's template
    if (modulesResult.status === 'fulfilled') {
      availableModules = modulesResult.value;
      console.log(`[WorkspacePageWrapper] Loaded ${availableModules.length} modules for company ${companyId}`);
    } else {
      console.error("Failed to fetch company modules.", modulesResult.reason);
      // We set empty array but don't throw, as the workspace can work without modules
      availableModules = [];
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