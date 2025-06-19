import { WorkspacePageWrapper } from '../workspace-page-wrapper'
import AnalyticsClientPage from './client-page'

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <AnalyticsClientPage />
    </WorkspacePageWrapper>
  )
} 