import { WorkspacePageWrapper } from '../workspace-page-wrapper'
import HubSpotClientPage from './client-page'

export default async function HubSpotPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    return (
        <WorkspacePageWrapper searchParams={searchParams}>
            <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
                <div className="flex flex-col gap-1.5 sm:gap-2">
                    <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 dark:text-gray-50">
                        HubSpot Analytics
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Dashboard de ventas, pipeline, seguimiento y reporteria.
                    </p>
                </div>

                <HubSpotClientPage />
            </div>
        </WorkspacePageWrapper>
    )
}
