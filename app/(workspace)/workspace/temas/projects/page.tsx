import { WorkspacePageWrapper } from '../../workspace-page-wrapper'
import ProjectsClientPage from './client-page'

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <ProjectsClientPage />
    </WorkspacePageWrapper>
  )
}
