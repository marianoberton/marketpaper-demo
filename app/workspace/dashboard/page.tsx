import { WorkspacePageWrapper } from "../../(workspace)/workspace/workspace-page-wrapper"
import DashboardClientPage from "./client-page"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <DashboardClientPage />
    </WorkspacePageWrapper>
  )
}
