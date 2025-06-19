import { WorkspacePageWrapper } from '../workspace-page-wrapper'

export default async function TestingPage({
  searchParams,
}: {
  searchParams: { [key:string]: string | string[] | undefined }
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Testing</h2>
        </div>
        <p>Este módulo está en construcción.</p>
      </div>
    </WorkspacePageWrapper>
  )
} 