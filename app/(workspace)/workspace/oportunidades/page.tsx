import { WorkspacePageWrapper } from '../workspace-page-wrapper'
import OportunidadesClientPage from './client-page'

export default async function OportunidadesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    return (
        <WorkspacePageWrapper searchParams={searchParams}>
            <OportunidadesClientPage />
        </WorkspacePageWrapper>
    )
}
