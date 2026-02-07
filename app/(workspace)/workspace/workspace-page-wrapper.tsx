import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { getCurrentUser } from '@/lib/auth-server';
import { getCurrentCompany, getEffectiveModulesForUser } from '@/lib/crm-multitenant';
import { WorkspaceLayoutWithProvider } from '../workspace-layout-with-provider';

interface WorkspacePageWrapperProps {
  children: React.ReactNode;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function WorkspacePageWrapper({ children, searchParams }: WorkspacePageWrapperProps) {
  let initialCompanyData = null;
  let fetchError: string | null = null;
  let availableModules: any[] = [];

  try {
    // Obtener usuario autenticado
    const user = await getCurrentUser();

    if (!user) {
      fetchError = "Usuario no autenticado.";
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

    // Obtener company_id del perfil del usuario
    // Solo super_admin puede especificar un company_id diferente
    const params = await searchParams;
    let companyId = user.company_id;

    if (user.role === 'super_admin' && params?.company_id) {
      companyId = params.company_id as string;
    }

    if (!companyId) {
      // Si es super_admin sin company_id, redirigir al panel de admin
      // donde puede seleccionar una empresa
      if (user.role === 'super_admin') {
        redirect('/admin');
      }

      // Para otros usuarios sin empresa, mostrar error
      fetchError = "Usuario sin empresa asignada. Por favor contacta al administrador.";
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
      getEffectiveModulesForUser(companyId, user.id, user.role),
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
    if (isRedirectError(error)) {
      throw error;
    }
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