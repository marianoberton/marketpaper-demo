import { WorkspacePageWrapper } from '../workspace-page-wrapper'
import CotizadorClientPage from './client-page'

export default async function CotizadorPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    return (
        <WorkspacePageWrapper searchParams={searchParams}>
            <CotizadorClientPage />
        </WorkspacePageWrapper>
    )
}
