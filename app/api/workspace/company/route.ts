import { NextRequest, NextResponse } from 'next/server'
import { getCurrentCompany } from '@/lib/crm-multitenant'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      )
    }

    const company = await getCurrentCompany(companyId)
    
    return NextResponse.json({
      id: company.id,
      name: company.name,
      features: company.features || []
    })
  } catch (error) {
    console.error('Error fetching company data:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
} 