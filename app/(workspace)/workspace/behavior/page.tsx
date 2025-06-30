import { WorkspacePageWrapper } from '../workspace-page-wrapper'
import BehaviorClientPage from './client-page'

export default async function BehaviorPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <BehaviorClientPage />
    </WorkspacePageWrapper>
  )
} 