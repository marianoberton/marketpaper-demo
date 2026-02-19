import { WorkspacePageWrapper } from '../../../workspace-page-wrapper'
import NuevoProjectClientPage from './client-page'

export default async function NuevoProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <NuevoProjectClientPage />
    </WorkspacePageWrapper>
  )
}
