import { WorkspacePageWrapper } from '../workspace-page-wrapper'
import ClientPage from './client-page'

export default async function SimuladordePagosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <ClientPage />
    </WorkspacePageWrapper>
  )
}
