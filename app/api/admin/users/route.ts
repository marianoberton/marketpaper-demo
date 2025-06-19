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

    // Fetch all users with their company information
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        companies (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Transform the data to match the expected format
    const transformedUsers = users?.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      company_id: user.company_id,
      company_name: user.companies?.name || null,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      last_login: user.last_login,
      api_access_enabled: user.api_access_enabled,
      monthly_llm_limit_cost: user.monthly_llm_limit_cost,
      onboarding_completed: user.onboarding_completed
    })) || []

    return NextResponse.json(transformedUsers)

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 