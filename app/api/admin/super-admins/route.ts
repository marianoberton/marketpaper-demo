import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET super-admins - Verificando super admin...')
    
    // Usar service role key para verificar super admin y obtener super admins
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // También crear cliente con cookies para verificar autenticación
    const serverSupabase = await createServerClient()
    const { data: { user }, error: userError } = await serverSupabase.auth.getUser()
    
    console.log('Usuario autenticado:', user?.id || 'None', userError)
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado - sin sesión' }, { status: 401 })
    }

    // Verificar que sea super admin
    const { data: superAdmin, error: adminError } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    console.log('Super admin check:', { superAdmin, adminError })

    if (!superAdmin) {
      return NextResponse.json({ error: 'No autorizado - no es super admin' }, { status: 403 })
    }

    // Obtener súper admins usando service role key
    console.log('🔍 Obteniendo súper admins de super_admins...')
    const { data: superAdmins, error: superAdminsError } = await supabase
      .from('super_admins')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('Súper admins obtenidos:', { count: superAdmins?.length || 0, error: superAdminsError })

    if (superAdminsError) {
      console.error('Error obteniendo súper admins:', superAdminsError)
      return NextResponse.json({ error: 'Error obteniendo súper admins' }, { status: 500 })
    }

    return NextResponse.json(superAdmins || [])

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 