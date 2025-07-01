import { WorkspacePageWrapper } from "../../workspace-page-wrapper"
import SettingsClientPage from "./client-page"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <SettingsClientPage />
    </WorkspacePageWrapper>
  )
}
