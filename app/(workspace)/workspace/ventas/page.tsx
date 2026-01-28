import { WorkspacePageWrapper } from '../workspace-page-wrapper'
import VentasClientPage from './client-page'

export default async function VentasPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    return (
        <WorkspacePageWrapper searchParams={searchParams}>
            <VentasClientPage />
        </WorkspacePageWrapper>
    )
}
