import { WorkspacePageWrapper } from '../workspace-page-wrapper'
import CalendarClientPage from './client-page'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <CalendarClientPage />
    </WorkspacePageWrapper>
  )
}