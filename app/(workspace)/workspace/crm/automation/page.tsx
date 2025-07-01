import { WorkspacePageWrapper } from "../../workspace-page-wrapper"
import AutomationClientPage from "./client-page"

export default async function AutomationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <AutomationClientPage />
    </WorkspacePageWrapper>
  )
}
