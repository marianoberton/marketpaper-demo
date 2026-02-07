import { WorkspacePageWrapper } from '../workspace-page-wrapper'
import { CrmDashboard } from './components/CrmDashboard'

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const companyId = params?.company_id as string | undefined;
  
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <CrmDashboard companyId={companyId} />
    </WorkspacePageWrapper>
  )
} 