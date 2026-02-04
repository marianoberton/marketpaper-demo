import { WorkspacePageWrapper } from '../workspace-page-wrapper'
import SoporteClientPage from './client-page'

export default async function SoportePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <SoporteClientPage />
    </WorkspacePageWrapper>
  )
}
