import { WorkspacePageWrapper } from '../workspace-page-wrapper'
import NotificationsClientPage from './client-page'

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <NotificationsClientPage />
    </WorkspacePageWrapper>
  )
}
