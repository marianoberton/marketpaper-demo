import { WorkspacePageWrapper } from '../../../workspace-page-wrapper'
import ProjectDetailClientPage from './client-page'

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params

  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <ProjectDetailClientPage projectId={resolvedParams.id} />
    </WorkspacePageWrapper>
  )
}
