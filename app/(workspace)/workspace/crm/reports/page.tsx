import { WorkspacePageWrapper } from "../../workspace-page-wrapper"
import ReportsClientPage from "./client-page"

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <ReportsClientPage />
    </WorkspacePageWrapper>
  )
}