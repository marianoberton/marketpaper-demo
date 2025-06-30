import { WorkspacePageWrapper } from '../workspace-page-wrapper'

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Gastos</h1>
        <p className="text-gray-600">Control de gastos y facturación</p>
      </div>
    </WorkspacePageWrapper>
  )
} 