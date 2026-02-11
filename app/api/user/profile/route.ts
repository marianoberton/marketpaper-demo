import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Get current user's profile
export async function GET() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Get full profile
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ profile })
}

// PUT - Update current user's profile (personal information only)
export async function PUT(request: NextRequest) {
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Extract only allowed fields that users can update themselves
    const allowedFields = [
      'full_name',
      'phone',
      'position',
      'department',
      'bio',
      'birthday',
      'gender',
      'avatar_url',
      'timezone',
      'locale',
      'preferences'
    ]

    const updates: Record<string, any> = {}

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    // Ensure there's something to update
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    // Update the profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json({ error: 'Error al actualizar el perfil' }, { status: 500 })
    }

    return NextResponse.json({ profile: updatedProfile })
  } catch (error: any) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
