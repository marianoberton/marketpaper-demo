import { WorkspacePageWrapper } from '../../workspace-page-wrapper'
import NuevoTicketClientPage from './client-page'

export default async function NuevoTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <NuevoTicketClientPage />
    </WorkspacePageWrapper>
  )
}
