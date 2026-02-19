import { WorkspacePageWrapper } from '../../workspace-page-wrapper'
import PendienteClienteClientPage from './client-page'

export default async function PendienteClientePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <PendienteClienteClientPage />
    </WorkspacePageWrapper>
  )
}
