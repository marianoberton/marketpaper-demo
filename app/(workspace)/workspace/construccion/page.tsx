import { WorkspacePageWrapper } from '../workspace-page-wrapper'
import ConstruccionClientPage from './client-page'

export default async function ConstruccionPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <ConstruccionClientPage />
    </WorkspacePageWrapper>
  )
} 