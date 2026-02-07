import { WorkspacePageWrapper } from '../../workspace-page-wrapper'
import ClientDetailPage from './client-page'

export default async function CrmClientDetailPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    return (
        <WorkspacePageWrapper searchParams={searchParams}>
            <ClientDetailPage />
        </WorkspacePageWrapper>
    )
}
