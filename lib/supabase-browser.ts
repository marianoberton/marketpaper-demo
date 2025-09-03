import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Cliente de Supabase optimizado para el navegador
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Cliente singleton para reutilizar la conexión
let supabaseClient: ReturnType<typeof createSupabaseBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseBrowserClient()
  }
  return supabaseClient
}

// Función para verificar autenticación
export async function getCurrentUser() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error getting user:', error)
      return { user: null, error }
    }
    
    return { user, error: null }
  } catch (error) {
    console.error('Unexpected error getting user:', error)
    return { user: null, error: error as Error }
  }
}

// Función para obtener sesión actual
export async function getCurrentSession() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      return { session: null, error }
    }
    
    return { session, error: null }
  } catch (error) {
    console.error('Unexpected error getting session:', error)
    return { session: null, error: error as Error }
  }
}

// Función para refrescar sesión
export async function refreshSession() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error('Error refreshing session:', error)
      return { session: null, error }
    }
    
    return { session: data.session, error: null }
  } catch (error) {
    console.error('Unexpected error refreshing session:', error)
    return { session: null, error: error as Error }
  }
}

// Función para manejar errores de autenticación
export function handleAuthError(error: any): string {
  if (!error) return 'Error desconocido'
  
  // Errores comunes de Supabase Auth
  if (error.message?.includes('Invalid login credentials')) {
    return 'Credenciales inválidas'
  }
  
  if (error.message?.includes('Email not confirmed')) {
    return 'Email no confirmado'
  }
  
  if (error.message?.includes('Invalid refresh token')) {
    return 'Sesión expirada, por favor inicia sesión nuevamente'
  }
  
  if (error.message?.includes('User not found')) {
    return 'Usuario no encontrado'
  }
  
  if (error.message?.includes('Network request failed')) {
    return 'Error de conexión, verifica tu internet'
  }
  
  return error.message || 'Error de autenticación'
}

// Función para manejar errores de storage
export function handleStorageError(error: any): string {
  if (!error) return 'Error desconocido'
  
  // Errores comunes de Supabase Storage
  if (error.message?.includes('The resource was not found')) {
    return 'Archivo no encontrado'
  }
  
  if (error.message?.includes('Bucket not found')) {
    return 'Bucket de almacenamiento no encontrado'
  }
  
  if (error.message?.includes('Payload too large')) {
    return 'El archivo es demasiado grande'
  }
  
  if (error.message?.includes('Invalid file type')) {
    return 'Tipo de archivo no permitido'
  }
  
  if (error.message?.includes('Duplicate')) {
    return 'Ya existe un archivo con ese nombre'
  }
  
  if (error.message?.includes('Insufficient permissions')) {
    return 'No tienes permisos para realizar esta acción'
  }
  
  return error.message || 'Error de almacenamiento'
}

// Función para validar configuración de Supabase
export function validateSupabaseConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL no está configurado')
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurado')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export default getSupabaseBrowserClient