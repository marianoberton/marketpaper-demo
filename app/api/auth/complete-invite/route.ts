import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Inicializar cliente admin con Service Role Key para saltar RLS y Auth context
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  
  try {
    const body = await request.json()
    const { token, userId } = body

    if (!token) {
      return NextResponse.json({ error: 'Token es requerido' }, { status: 400 })
    }
    
    if (!userId) {
       return NextResponse.json({ error: 'User ID es requerido' }, { status: 400 })
    }

    // 1. Buscar la invitación (sin restricciones RLS)
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('company_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (inviteError || !invitation) {
        console.error('Error buscando invitación:', inviteError)
        return NextResponse.json({ error: 'Invitación no válida o expirada' }, { status: 404 })
    }

    // 2. Obtener el usuario REAL de Auth
    // (Ya tenemos userId del body)

    // 3. Obtener el usuario REAL de Auth para validar (seguridad)
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (userError || !user) {
       return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // 4. Validar que el email del usuario coincida con la invitación
    if (user.email?.trim().toLowerCase() !== invitation.email.trim().toLowerCase()) {
       return NextResponse.json({ error: 'El email del usuario no coincide con la invitación' }, { status: 403 })
    }

    // 5. Crear/Actualizar Perfil de Usuario
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: user.email!, // Safe assert, we checked email match
        full_name: user.user_metadata?.full_name || user.email,
        role: invitation.target_role,
        company_id: invitation.company_id,
        status: 'active',
        updated_at: new Date().toISOString(),
        ...(invitation.client_id ? { client_id: invitation.client_id } : {})
      })
      .select()

    if (profileError) {
      console.error('Error creando perfil:', profileError)
      return NextResponse.json({ error: 'Error al crear perfil de usuario: ' + profileError.message }, { status: 500 })
    }

    // 6. Marcar invitación como aceptada
    await supabaseAdmin
      .from('company_invitations')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', invitation.id)

    // 7. Limpiar pending users (defensivo)
    try {
        await supabaseAdmin
            .from('pending_company_users')
            .delete()
            .eq('email', user.email!)
    } catch (e) {
        // Ignorar
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error procesando invitación:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
