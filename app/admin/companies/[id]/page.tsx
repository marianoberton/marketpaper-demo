import {
  getCompanyById,
  getCompanyUsers,
  getCompanyUsageStats,
} from '@/lib/super-admin'
import CompanyDetailsClient from './client-page'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CompanyDetailsPage({ params }: PageProps) {
  const resolvedParams = await params
  const companyId = resolvedParams.id

  try {
    const [companyData, usersData, statsData] = await Promise.all([
      getCompanyById(companyId),
      getCompanyUsers(companyId),
      getCompanyUsageStats(companyId),
    ])

    if (!companyData) {
      notFound()
    }

    return (
      <CompanyDetailsClient
        initialCompany={companyData}
        initialUsers={usersData}
        initialUsageStats={statsData}
      />
    )
  } catch (error) {
    console.error('[Server] Error fetching company details:', error)
    // You can return a more specific error component here
    notFound()
  }
} 