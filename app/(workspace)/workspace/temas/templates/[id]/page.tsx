import { WorkspacePageWrapper } from '../../../workspace-page-wrapper'
import EditTemplateClientPage from './client-page'

export default async function EditTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params

  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <EditTemplateClientPage templateId={resolvedParams.id} />
    </WorkspacePageWrapper>
  )
}
