import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  const { email, password, fullName } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    )
  }

  try {
    const supabaseAdmin = createSupabaseAdmin()
    
    // 1. Crear usuario en auth
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || email }
    })

    if (userError) {
      throw new Error(`Failed to create user: ${userError.message}`)
    }

    console.log('User created:', user)

    // 2. Crear perfil manualmente (en caso de que el trigger no funcione)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert([{
        id: user.user.id,
        email: email,
        full_name: fullName || email,
        company_id: null, // Sin empresa inicialmente
        role: 'member',
        status: 'pending'
      }])
      .select()
      .single()

    if (profileError) {
      console.log('Profile creation error (might be normal if trigger worked):', profileError)
    }

    return NextResponse.json({
      message: 'User created successfully!',
      user: {
        id: user.user.id,
        email: user.user.email
      }
    })
  } catch (error: any) {
    console.error('Full error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 