import { WorkspacePageWrapper } from '../workspace-page-wrapper'
import TareasClientPage from './client-page'

export default async function TareasPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    return (
        <WorkspacePageWrapper searchParams={searchParams}>
            <TareasClientPage />
        </WorkspacePageWrapper>
    )
}
