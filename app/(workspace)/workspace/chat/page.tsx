import { WorkspacePageWrapper } from '../workspace-page-wrapper'
import ChatClientPage from './client-page'

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <ChatClientPage />
    </WorkspacePageWrapper>
  )
} 