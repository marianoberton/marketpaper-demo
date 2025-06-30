import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
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

    const supabase = await createClient()

    // Insertar solicitud de registro
    const { data, error } = await supabase
      .from('registration_requests')
      .insert({
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
      })
      .select()
      .single()

    if (error) {
      console.error('Error insertando solicitud de registro:', error)
      return NextResponse.json(
        { error: 'Error procesando solicitud. Inténtelo más tarde.' },
        { status: 500 }
      )
    }

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
    console.error('Error en endpoint de registro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET para obtener solicitudes (para admin)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar que sea super admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!superAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener solicitudes
    const { data, error } = await supabase
      .from('registration_requests')
      .select('*')
      .order('requested_at', { ascending: false })

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