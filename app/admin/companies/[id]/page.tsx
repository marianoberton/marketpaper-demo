import {
  getCompanyById,
  getCompanyUsers,
  getCompanyApiKeys,
  getCompanyUsageStats,
} from '@/lib/super-admin'
import CompanyDetailsClient from './client-page'
import { notFound } from 'next/navigation'

interface PageProps {
  params: {
    id: string
  }
}

export default async function CompanyDetailsPage({ params }: PageProps) {
  const companyId = params.id

  try {
    const [companyData, usersData, apiKeysData, statsData] = await Promise.all([
      getCompanyById(companyId),
      getCompanyUsers(companyId),
      getCompanyApiKeys(companyId),
      getCompanyUsageStats(companyId),
    ])

    if (!companyData) {
      notFound()
    }

    return (
      <CompanyDetailsClient
        initialCompany={companyData}
        initialUsers={usersData}
        initialApiKeys={apiKeysData}
        initialUsageStats={statsData}
      />
    )
  } catch (error) {
    console.error('[Server] Error fetching company details:', error)
    // You can return a more specific error component here
    notFound()
  }
} 