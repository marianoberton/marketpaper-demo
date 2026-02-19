import { WorkspacePageWrapper } from '../../../workspace-page-wrapper'
import NuevoTemplateClientPage from './client-page'

export default async function NuevoTemplatePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <NuevoTemplateClientPage />
    </WorkspacePageWrapper>
  )
}
