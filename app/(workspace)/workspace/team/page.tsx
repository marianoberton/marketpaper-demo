import { WorkspacePageWrapper } from '../workspace-page-wrapper'
import TeamClientPage from './client-page'

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <TeamClientPage />
    </WorkspacePageWrapper>
  )
} 