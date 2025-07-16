import { WorkspacePageWrapper } from '../workspace-page-wrapper'
import FinanzasClientPage from './client-page'

export default async function FinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <FinanzasClientPage />
    </WorkspacePageWrapper>
  )
} 