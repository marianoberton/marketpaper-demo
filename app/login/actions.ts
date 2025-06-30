'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // Validar inputs
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return redirect('/login?message=Email y contraseña son requeridos')
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    console.error('Login error:', error)
    let message = 'Error al autenticarse'
    
    if (error.message.includes('Invalid login credentials')) {
      message = 'Email o contraseña incorrectos'
    } else if (error.message.includes('Email not confirmed')) {
      message = 'Email no confirmado. Revisa tu bandeja de entrada'
    } else if (error.message.includes('Too many requests')) {
      message = 'Demasiados intentos. Intenta más tarde'
    }
    
    return redirect(`/login?message=${encodeURIComponent(message)}`)
  }

  if (!authData.user) {
    return redirect('/login?message=Error en la autenticación')
  }

  // Actualizar último login
  try {
    await supabase
      .from('user_profiles')
      .update({ 
        last_login: new Date().toISOString() 
      })
      .eq('id', authData.user.id)
  } catch (updateError) {
    console.error('Error updating last login:', updateError)
    // No fallar el login por esto
  }
  
  // El middleware manejará la redirección basada en el rol del usuario
  return redirect('/')
} 