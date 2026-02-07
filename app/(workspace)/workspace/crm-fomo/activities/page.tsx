import { WorkspacePageWrapper } from "../../workspace-page-wrapper"
import ActivitiesClientPage from "./client-page"

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <ActivitiesClientPage />
    </WorkspacePageWrapper>
  )
}
