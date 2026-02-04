import { WorkspacePageWrapper } from '../workspace-page-wrapper'
import HubSpotClientPage from './client-page'

export default async function HubSpotPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    return (
        <WorkspacePageWrapper searchParams={searchParams}>
            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-gray-50">
                        HubSpot Analytics
                    </h1>
                    <p className="text-muted-foreground">
                        Dashboard de ventas, pipeline, seguimiento y reporteria.
                    </p>
                </div>

                <HubSpotClientPage />
            </div>
        </WorkspacePageWrapper>
    )
}
