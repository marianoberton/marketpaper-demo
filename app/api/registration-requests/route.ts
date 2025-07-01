import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📧 Datos recibidos para registro:', { name: body.name, email: body.email, company: body.company, phone: body.phone })
    
    const { name, email, company, phone } = body

    // Validación básica
    if (!name || !email || !company || !phone) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    // Usar service role key para bypass RLS en formulario público
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    console.log('🔗 Cliente Supabase creado con service role key')

    // Datos a insertar
    const insertData = {
      full_name: name,
      email: email.toLowerCase(),
      company_name: company,
      phone: phone,
      status: 'pending',
      requested_at: new Date().toISOString(),
      metadata: {
        user_agent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      }
    }
    
    console.log('📝 Datos a insertar:', insertData)

    // Insertar solicitud de registro
    const { data, error } = await supabase
      .from('registration_requests')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('❌ Error insertando solicitud de registro:', {
        error: error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        data: insertData
      })
      return NextResponse.json(
        { error: 'Error procesando solicitud. Inténtelo más tarde.', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Solicitud insertada correctamente:', data)

    // Log para el admin (puedes reemplazar esto con notificación por email)
    console.log('🔔 Nueva solicitud de registro:', {
      id: data.id,
      name,
      email,
      company,
      phone,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Solicitud enviada correctamente',
      requestId: data.id
    })

  } catch (error) {
    console.error('❌ Error en endpoint de registro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET para obtener solicitudes (para admin)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET solicitudes - Verificando super admin...')
    
    // Usar service role key para verificar super admin y obtener solicitudes
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

    // Obtener solicitudes usando service role key
    console.log('🔍 Obteniendo solicitudes de registration_requests...')
    const { data, error } = await supabase
      .from('registration_requests')
      .select('*')
      .order('requested_at', { ascending: false })

    console.log('Solicitudes obtenidas:', { count: data?.length || 0, error })

    if (error) {
      console.error('Error obteniendo solicitudes:', error)
      return NextResponse.json({ error: 'Error obteniendo solicitudes' }, { status: 500 })
    }

    return NextResponse.json({ requests: data })

  } catch (error) {
    console.error('Error en GET registration-requests:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 