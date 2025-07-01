import { WorkspacePageWrapper } from "../../workspace-page-wrapper"
import InboxClientPage from "./client-page"

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <InboxClientPage />
    </WorkspacePageWrapper>
  )
}