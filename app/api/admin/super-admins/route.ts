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

    // Fetch all super admins
    const { data: superAdmins, error: superAdminsError } = await supabase
      .from('super_admins')
      .select('*')
      .order('created_at', { ascending: false })

    if (superAdminsError) {
      console.error('Error fetching super admins:', superAdminsError)
      return NextResponse.json({ error: 'Failed to fetch super admins' }, { status: 500 })
    }

    return NextResponse.json(superAdmins || [])

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 