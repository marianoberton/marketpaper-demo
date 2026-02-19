import { WorkspacePageWrapper } from '../../workspace-page-wrapper'
import TemplatesClientPage from './client-page'

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <TemplatesClientPage />
    </WorkspacePageWrapper>
  )
}
