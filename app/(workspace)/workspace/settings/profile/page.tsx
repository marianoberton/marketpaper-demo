import { WorkspacePageWrapper } from '../../workspace-page-wrapper'
import ProfileClientPage from './client-page'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <ProfileClientPage />
    </WorkspacePageWrapper>
  )
}
