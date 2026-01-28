import { WorkspacePageWrapper } from '../workspace-page-wrapper'
import TemasClientPage from './client-page'

export default async function TemasPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <TemasClientPage />
    </WorkspacePageWrapper>
  )
}
