import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET users - Verificando super admin...')
    
    // Usar service role key para verificar super admin y obtener usuarios
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

    // Obtener usuarios usando service role key
    console.log('🔍 Obteniendo usuarios de user_profiles...')
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        companies (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    console.log('Usuarios obtenidos:', { count: users?.length || 0, error: usersError })

    if (usersError) {
      console.error('Error obteniendo usuarios:', usersError)
      return NextResponse.json({ error: 'Error obteniendo usuarios' }, { status: 500 })
    }

    // Transform the data to match the expected format
    const transformedUsers = users?.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      company_id: user.company_id,
      company_name: user.companies?.name || null,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      last_login: user.last_login,
      api_access_enabled: user.api_access_enabled,
      monthly_llm_limit_cost: user.monthly_llm_limit_cost,
      onboarding_completed: user.onboarding_completed
    })) || []

    return NextResponse.json(transformedUsers)

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT para actualizar usuario
export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 PUT users - Actualizando usuario...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const serverSupabase = await createServerClient()
    const { data: { user }, error: userError } = await serverSupabase.auth.getUser()
    
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

    if (!superAdmin) {
      return NextResponse.json({ error: 'No autorizado - no es super admin' }, { status: 403 })
    }

    const updateData = await request.json()

    if (!updateData.id) {
      return NextResponse.json({ error: 'ID del usuario es requerido' }, { status: 400 })
    }

    // Actualizar usuario
    const { data: updatedUser, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        full_name: updateData.full_name,
        role: updateData.role,
        status: updateData.status
      })
      .eq('id', updateData.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error actualizando usuario:', updateError)
      return NextResponse.json({ error: 'Error actualizando usuario' }, { status: 500 })
    }

    console.log('✅ Usuario actualizado:', updatedUser)
    return NextResponse.json(updatedUser)

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE para eliminar usuario
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ DELETE users - Eliminando usuario...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const serverSupabase = await createServerClient()
    const { data: { user }, error: userError } = await serverSupabase.auth.getUser()
    
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

    if (!superAdmin) {
      return NextResponse.json({ error: 'No autorizado - no es super admin' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'ID del usuario es requerido' }, { status: 400 })
    }

    // No permitir que un usuario se elimine a sí mismo
    if (userId === user.id) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 })
    }

    // Verificar que el usuario existe
    const { data: targetUser, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .eq('id', userId)
      .single()

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // No permitir eliminar otros super admins
    if (targetUser.role === 'super_admin') {
      // También eliminar de super_admins table
      await supabase
        .from('super_admins')
        .delete()
        .eq('user_id', userId)
    }

    // Eliminar de user_profiles
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error eliminando perfil:', profileError)
      return NextResponse.json({ error: 'Error eliminando perfil de usuario' }, { status: 500 })
    }

    // Eliminar de auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error eliminando auth user:', authError)
      // No fallar si el perfil ya fue eliminado pero auth falló
    }

    console.log('✅ Usuario eliminado:', targetUser.email)
    return NextResponse.json({ message: 'Usuario eliminado exitosamente' })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST para crear usuario
export async function POST(request: NextRequest) {
  try {
    console.log('➕ POST users - Creando usuario...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const serverSupabase = await createServerClient()
    const { data: { user }, error: userError } = await serverSupabase.auth.getUser()
    
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

    if (!superAdmin) {
      return NextResponse.json({ error: 'No autorizado - no es super admin' }, { status: 403 })
    }

    const userData = await request.json()

    if (!userData.email || !userData.full_name || !userData.role) {
      return NextResponse.json({ error: 'Email, nombre y rol son requeridos' }, { status: 400 })
    }

    // Usar contraseña personalizada o generar temporal
    const isCustomPassword = userData.password && userData.password.trim() !== ''
    const finalPassword = isCustomPassword 
      ? userData.password.trim()
      : Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()

    // Crear usuario en auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: finalPassword,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
      },
    })

    if (authError) {
      console.error('Error creando usuario auth:', authError)
      return NextResponse.json({ error: `Error creando usuario: ${authError.message}` }, { status: 500 })
    }

    const newUserId = authUser.user.id

    // Crear perfil de usuario
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: newUserId,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        company_id: userData.company_id || null,
        status: 'active'
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creando perfil:', profileError)
      // Limpiar usuario auth si falla el perfil
      await supabase.auth.admin.deleteUser(newUserId)
      return NextResponse.json({ error: `Error creando perfil: ${profileError.message}` }, { status: 500 })
    }

    // Si es super admin, crear registro en super_admins
    if (userData.role === 'super_admin') {
      const { error: superAdminError } = await supabase
        .from('super_admins')
        .insert({
          user_id: newUserId,
          email: userData.email,
          full_name: userData.full_name,
          role: 'admin',
          status: 'active'
        })

      if (superAdminError) {
        console.error('Error creando super admin:', superAdminError)
        // Limpiar registros creados
        await supabase.from('user_profiles').delete().eq('id', newUserId)
        await supabase.auth.admin.deleteUser(newUserId)
        return NextResponse.json({ error: `Error creando super admin: ${superAdminError.message}` }, { status: 500 })
      }
    }

    console.log('✅ Usuario creado:', userData.email, '- Contraseña:', isCustomPassword ? 'personalizada' : finalPassword)
    
    return NextResponse.json({ 
      user: profile,
      tempPassword: isCustomPassword ? null : finalPassword // Solo mostrar si es temporal
    }, { status: 201 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}