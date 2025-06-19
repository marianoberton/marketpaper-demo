import { ReactNode } from 'react'
import { CompanyProvider } from '@/app/providers/CompanyProvider'
import TenantSwitcher from '@/components/TenantSwitcher'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { WorkspaceLayout } from '@/components/workspace-layout'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <CompanyProvider>
      <WorkspaceLayout>
        {children}
      </WorkspaceLayout>
    </CompanyProvider>
  )
}
