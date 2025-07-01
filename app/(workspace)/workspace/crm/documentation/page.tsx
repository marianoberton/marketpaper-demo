import { WorkspacePageWrapper } from "../../workspace-page-wrapper"
import DocumentationClientPage from "./client-page"

export default async function DocumentationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <DocumentationClientPage />
    </WorkspacePageWrapper>
  )
}
