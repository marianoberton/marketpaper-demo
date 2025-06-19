import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  const { companyName, companySlug, userEmail } = await request.json()

  if (!companyName || !companySlug || !userEmail) {
    return NextResponse.json(
      { error: 'Missing required fields: companyName, companySlug, userEmail' },
      { status: 400 }
    )
  }

  try {
    const supabaseAdmin = createSupabaseAdmin()
    
    // 1. Crear la empresa
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert([
        {
          name: companyName,
          slug: companySlug,
          plan: 'enterprise', // o el plan que prefieras
          status: 'active',
        },
      ])
      .select()
      .single()

    if (companyError) {
      console.error('Error creating company:', companyError)
      // Check for unique constraint violation on slug
      if (companyError.code === '23505') {
        return NextResponse.json({ error: 'Company slug already exists.' }, { status: 409 })
      }
      throw new Error(`Failed to create company: ${companyError.message}`)
    }

    console.log('Company created:', company)

    // 2. Encontrar al usuario por su email usando listUsers
    const { data: { users }, error: userListError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      // @ts-ignore
      email: userEmail
    })

    if (userListError) {
        console.error('Error listing users:', userListError)
        throw new Error(`Error listing users: ${userListError.message}`)
    }

    if (!users || users.length === 0) {
      throw new Error(`User not found with email ${userEmail}`)
    }
    const user = users[0]
    
    console.log('User found:', user)

    // 3. Actualizar el perfil del usuario para asignarle la empresa y el rol de 'owner'
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        company_id: company.id,
        role: 'owner',
      })
      .eq('id', user.id)
      .select()
      .single()

    if (profileError) {
      console.error('Error updating user profile:', profileError)
      throw new Error(`Failed to update user profile: ${profileError.message}`)
    }

    console.log('User profile updated:', profile)

    return NextResponse.json({
      message: 'Company created and owner assigned successfully!',
      company,
      profile,
    })
  } catch (error: any) {
    console.error('Full error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 