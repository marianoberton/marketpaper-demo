import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// This creates a Supabase client with the service role key, bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json()

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId and email are required' },
        { status: 400 }
      )
    }

    // Check if user is already a super admin
    const { data: existingSuperAdmin, error: checkError } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking super admin:', checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (existingSuperAdmin) {
      return NextResponse.json(
        { message: 'User is already a super admin' },
        { status: 200 }
      )
    }

    // Insert into super_admins table using the admin client
    const { error: insertError } = await supabaseAdmin
      .from('super_admins')
      .insert({
        user_id: userId,
        email: email,
        role: 'super_admin',
        status: 'active',
      })

    if (insertError) {
      console.error('Error inserting super admin:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      message: `Successfully made ${email} a super admin. Please log out and log back in to see changes.`,
    })
  } catch (error: any) {
    console.error('Unexpected error in create-super-admin:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 