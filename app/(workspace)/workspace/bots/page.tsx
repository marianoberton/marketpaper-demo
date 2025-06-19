import { WorkspacePageWrapper } from '../workspace-page-wrapper'
import BotsClientPage from './client-page'

export default async function BotsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <BotsClientPage />
    </WorkspacePageWrapper>
  )
}