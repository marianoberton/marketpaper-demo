import { WorkspacePageWrapper } from '../../workspace-page-wrapper'
import TemaDetailClientPage from './client-page'

export default async function TemaDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await params

    return (
        <WorkspacePageWrapper searchParams={searchParams}>
            <TemaDetailClientPage temaId={resolvedParams.id} />
        </WorkspacePageWrapper>
    )
}
