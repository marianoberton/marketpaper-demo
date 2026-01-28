import { WorkspacePageWrapper } from '../../workspace-page-wrapper'
import CompanyUsersPage from './client-page'

export default function Page({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    return (
        <WorkspacePageWrapper searchParams={searchParams}>
            <CompanyUsersPage />
        </WorkspacePageWrapper>
    )
}
