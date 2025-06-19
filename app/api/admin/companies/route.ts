import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
        },
      }
    )

    // Verify user is authenticated and is a super admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a super admin
    const { data: superAdmin, error: superAdminError } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (superAdminError || !superAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch companies with their template information
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(`
        *,
        client_templates!template_id (
          name,
          category
        )
      `)
      .order('created_at', { ascending: false })

    if (companiesError) {
      console.error('Error fetching companies:', companiesError)
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
    }

    // Transform the data to match the expected format
    const transformedCompanies = companies?.map(company => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
      contact_email: company.contact_email,
      contact_phone: company.contact_phone,
      domain: company.domain,
      plan: company.plan,
      status: company.status,
      monthly_price: company.monthly_price,
      max_users: company.max_users,
      max_contacts: company.max_contacts,
      created_at: company.created_at,
      trial_ends_at: company.trial_ends_at,
      current_users: company.current_users || 0,
      client_template_id: company.template_id,
      template_name: company.client_templates?.name || null
    })) || []

    return NextResponse.json(transformedCompanies)

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: superAdmin, error: superAdminError } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (superAdminError || !superAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const companyId = new URL(request.url).searchParams.get('id')
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    const { client_template_id } = await request.json()
    if (!client_template_id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('companies')
      .update({ template_id: client_template_id })
      .eq('id', companyId)
      .select(`
        *,
        client_templates!template_id (
          name
        )
      `)
      .single()

    if (error) {
      console.error('Error updating company template:', error)
      return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API PUT Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 