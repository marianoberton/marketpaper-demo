import { WorkspacePageWrapper } from '../../workspace-page-wrapper'
import DebugUploadClientPage from './client-page'

export default async function DebugUploadPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <DebugUploadClientPage />
    </WorkspacePageWrapper>
  )
}