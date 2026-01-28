import { WorkspacePageWrapper } from '../../workspace-page-wrapper'
import DealDetailClientPage from './client-page'

export default async function DealDetailPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    return (
        <WorkspacePageWrapper searchParams={searchParams}>
            <DealDetailClientPage />
        </WorkspacePageWrapper>
    )
}
