import { WorkspacePageWrapper } from '../../workspace-page-wrapper'
import TicketDetailClientPage from './client-page'

export default async function TicketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params

  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <TicketDetailClientPage ticketId={id} />
    </WorkspacePageWrapper>
  )
}
