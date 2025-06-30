import { WorkspaceDashboard } from './workspace-dashboard'
import { WorkspacePageWrapper } from './workspace-page-wrapper'

export default function WorkspacePage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <WorkspaceDashboard />
    </WorkspacePageWrapper>
  )
} 