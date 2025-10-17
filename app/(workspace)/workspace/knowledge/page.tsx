import { WorkspacePageWrapper } from '../workspace-page-wrapper'
import KnowledgeClientPage from './client-page'

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <KnowledgeClientPage />
    </WorkspacePageWrapper>
  )
}