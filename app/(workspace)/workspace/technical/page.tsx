import { WorkspacePageWrapper } from '../workspace-page-wrapper'

export default async function TechnicalPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <WorkspacePageWrapper searchParams={searchParams}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Técnico</h1>
        <p className="text-gray-600">Recursos técnicos</p>
      </div>
    </WorkspacePageWrapper>
  )
} 