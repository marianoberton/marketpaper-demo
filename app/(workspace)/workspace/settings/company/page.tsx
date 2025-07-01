import { WorkspacePageWrapper } from "../../workspace-page-wrapper"
import CompanySettingsClientPage from "./client-page"

export default async function CompanySettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <CompanySettingsClientPage />
    </WorkspacePageWrapper>
  )
}