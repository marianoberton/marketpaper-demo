import { WorkspacePageWrapper } from "../../workspace-page-wrapper"
import ContactsClientPage from "./client-page"

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <ContactsClientPage />
    </WorkspacePageWrapper>
  )
}
