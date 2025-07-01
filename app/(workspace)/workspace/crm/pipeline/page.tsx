import { WorkspacePageWrapper } from '../../workspace-page-wrapper'
import PipelineClientPage from './client-page'

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <PipelineClientPage />
    </WorkspacePageWrapper>
  )
} 