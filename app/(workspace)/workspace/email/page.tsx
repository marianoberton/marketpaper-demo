import { WorkspacePageWrapper } from '../workspace-page-wrapper'

export default async function EmailPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Email</h1>
        <p className="text-gray-600">Gestión de email marketing</p>
      </div>
    </WorkspacePageWrapper>
  )
} 