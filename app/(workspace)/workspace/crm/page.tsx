import { WorkspacePageWrapper } from '../workspace-page-wrapper'
import CrmClientPage from './client-page'

export default async function CrmPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    return (
        <WorkspacePageWrapper searchParams={searchParams}>
            <CrmClientPage />
        </WorkspacePageWrapper>
    )
}
