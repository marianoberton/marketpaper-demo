'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/client-login?message=Credenciales incorrectas')
  }

  // Verificar que el usuario tenga rol de viewer
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (profile?.role !== 'viewer') {
    await supabase.auth.signOut()
    redirect('/client-login?message=Acceso no autorizado')
  }

  revalidatePath('/', 'layout')
  redirect('/client-view')
}