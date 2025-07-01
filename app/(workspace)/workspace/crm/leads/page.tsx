import { WorkspacePageWrapper } from "../../workspace-page-wrapper"
import LeadsClientPage from "./client-page"

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <LeadsClientPage />
    </WorkspacePageWrapper>
  )
}
