import { WorkspacePageWrapper } from '../workspace-page-wrapper'

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">CRM</h1>
        <p className="text-gray-600">Sistema de gestión de relaciones con clientes</p>
      </div>
    </WorkspacePageWrapper>
  )
} 