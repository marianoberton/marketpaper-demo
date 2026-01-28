import { WorkspacePageWrapper } from '../../workspace-page-wrapper'
import NuevoTemaClientPage from './client-page'

export default async function NuevoTemaPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    return (
        <WorkspacePageWrapper searchParams={searchParams}>
            <NuevoTemaClientPage />
        </WorkspacePageWrapper>
    )
}
