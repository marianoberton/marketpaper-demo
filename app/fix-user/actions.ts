'use server'

import { createSupabaseAdmin } from '@/lib/supabase'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function checkAndFixUserProfile() {
  const supabase = createServerComponentClient({ cookies })
  const supabaseAdmin = createSupabaseAdmin()

  try {
    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Could not get current user. Are you logged in?' }
    }

    // 2. Check if profile exists
    const { data: existingProfile, error: selectError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, company_id')
      .eq('id', user.id)
      .single()

    // PGRST116 means no row was found, which is what we expect if the profile is missing.
    if (selectError && selectError.code !== 'PGRST116') {
      throw new Error(`Error checking for profile: ${selectError.message}`)
    }
    
    // If profile exists and is linked to a company, everything is fine.
    if (existingProfile && existingProfile.company_id) {
      return { success: true, message: 'User profile already exists and is correctly configured.' }
    }

    // 3. Profile does not exist or is not linked, so we create/update it.
    // First, find the 'fomo' company to link the user to.
    const { data: fomoCompany, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('slug', 'fomo')
      .single()

    if (companyError || !fomoCompany) {
      throw new Error(`Could not find the default 'fomo' company. Error: ${companyError?.message || 'Not found'}`)
    }

    // 4. Create or Update the profile
    const { data: newProfile, error: upsertError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata.full_name || user.email,
        company_id: fomoCompany.id,
        role: 'owner',
        status: 'active'
      })
      .select()
      .single()

    if (upsertError) {
      throw new Error(`Failed to create/update user profile: ${upsertError.message}`)
    }

    return { success: true, message: 'Successfully created/repaired user profile!', data: newProfile }

  } catch (err: any) {
    console.error('Check/Fix User Profile Error:', err)
    return { success: false, error: err.message }
  }
} 