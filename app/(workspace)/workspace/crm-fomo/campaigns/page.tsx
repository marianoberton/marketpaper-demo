import { WorkspacePageWrapper } from "../../workspace-page-wrapper"
import CampaignsClientPage from "./client-page"

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <CampaignsClientPage />
    </WorkspacePageWrapper>
  )
}
