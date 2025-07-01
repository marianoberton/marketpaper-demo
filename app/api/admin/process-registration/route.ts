import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'

// Use service role key for admin operations
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

export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario sea super admin
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar que sea super admin
    const { data: superAdmin, error: superAdminError } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (superAdminError || !superAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { request_id, action, company_id, new_company_name, role, notes } = body

    console.log('🎯 Procesando solicitud:', { request_id, action, company_id, new_company_name, role })

    // Obtener la solicitud de registro
    const { data: registrationRequest, error: requestError } = await supabaseAdmin
      .from('registration_requests')
      .select('*')
      .eq('id', request_id)
      .single()

    if (requestError || !registrationRequest) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (registrationRequest.status !== 'pending') {
      return NextResponse.json({ error: 'La solicitud ya fue procesada' }, { status: 400 })
    }

    let result = null

    switch (action) {
      case 'create_super_admin':
        result = await createSuperAdmin(registrationRequest)
        break

      case 'assign_to_company':
        if (!company_id || !role) {
          return NextResponse.json({ error: 'company_id y role son requeridos para asignar a compañía' }, { status: 400 })
        }
        result = await assignToCompany(registrationRequest, company_id, role)
        break

      case 'create_new_company':
        if (!new_company_name) {
          return NextResponse.json({ error: 'new_company_name es requerido para crear nueva compañía' }, { status: 400 })
        }
        result = await createNewCompany(registrationRequest, new_company_name)
        break

      case 'reject':
        result = await rejectRequest(registrationRequest, notes)
        break

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }

    if (result.success) {
      // Actualizar el status de la solicitud
      const newStatus = action === 'reject' ? 'rejected' : 'processed'
      const { error: updateError } = await supabaseAdmin
        .from('registration_requests')
        .update({
          status: newStatus,
          processed_at: new Date().toISOString(),
          processed_by: user.id,
          notes: notes || null
        })
        .eq('id', request_id)

      if (updateError) {
        console.error('Error actualizando solicitud:', updateError)
        return NextResponse.json({ error: 'Error actualizando solicitud' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: `Solicitud ${newStatus === 'rejected' ? 'rechazada' : 'procesada'} exitosamente`,
        details: result.details
      })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

  } catch (error) {
    console.error('Error procesando solicitud:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Función para crear super admin
async function createSuperAdmin(request: any) {
  try {
    console.log('🔑 Creando super admin para:', request.email)

    // 1. Crear usuario en auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: request.email,
      password: generateTemporaryPassword(),
      email_confirm: true,
      user_metadata: {
        full_name: request.full_name,
      },
    })

    if (authError) {
      console.error('Error creando usuario auth:', authError)
      return { success: false, error: `Error creando usuario: ${authError.message}` }
    }

    const userId = authData.user.id

    // 2. Crear perfil de usuario como super admin (sin company_id)
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId,
        email: request.email,
        full_name: request.full_name,
        role: 'super_admin',
        company_id: null,
        status: 'active'
      })

    if (profileError) {
      console.error('Error creando perfil de usuario:', profileError)
      // Limpiar usuario auth si falla el perfil
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return { success: false, error: `Error creando perfil: ${profileError.message}` }
    }

    // 3. Crear registro en super_admins
    const { error: superAdminError } = await supabaseAdmin
      .from('super_admins')
      .insert({
        user_id: userId,
        email: request.email,
        full_name: request.full_name,
        role: 'admin',
        status: 'active'
      })

    if (superAdminError) {
      console.error('Error creando super admin:', superAdminError)
      // Limpiar registros creados
      await supabaseAdmin.from('user_profiles').delete().eq('id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return { success: false, error: `Error creando super admin: ${superAdminError.message}` }
    }

    return { 
      success: true, 
      details: { 
        userId, 
        role: 'super_admin',
        message: 'Super admin creado exitosamente' 
      } 
    }

  } catch (error) {
    console.error('Error en createSuperAdmin:', error)
    return { success: false, error: 'Error interno creando super admin' }
  }
}

// Función para asignar a compañía existente
async function assignToCompany(request: any, companyId: string, role: string) {
  try {
    console.log('🏢 Asignando a compañía:', { companyId, role })

    // Verificar que la compañía existe
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return { success: false, error: 'Compañía no encontrada' }
    }

    // 1. Crear usuario en auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: request.email,
      password: generateTemporaryPassword(),
      email_confirm: true,
      user_metadata: {
        full_name: request.full_name,
      },
    })

    if (authError) {
      console.error('Error creando usuario auth:', authError)
      return { success: false, error: `Error creando usuario: ${authError.message}` }
    }

    const userId = authData.user.id

    // 2. Crear perfil de usuario
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId,
        email: request.email,
        full_name: request.full_name,
        role: role,
        company_id: companyId,
        status: 'active'
      })

    if (profileError) {
      console.error('Error creando perfil de usuario:', profileError)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return { success: false, error: `Error creando perfil: ${profileError.message}` }
    }

    return { 
      success: true, 
      details: { 
        userId, 
        companyId, 
        companyName: company.name,
        role,
        message: `Usuario asignado a ${company.name} como ${role}` 
      } 
    }

  } catch (error) {
    console.error('Error en assignToCompany:', error)
    return { success: false, error: 'Error interno asignando a compañía' }
  }
}

// Función para crear nueva compañía
async function createNewCompany(request: any, companyName: string) {
  try {
    console.log('🏗️ Creando nueva compañía:', companyName)

    // 1. Crear la compañía
    const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
    
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: companyName,
        slug: companySlug,
        status: 'active',
        plan: 'starter'
      })
      .select()
      .single()

    if (companyError) {
      console.error('Error creando compañía:', companyError)
      return { success: false, error: `Error creando compañía: ${companyError.message}` }
    }

    const companyId = company.id

    // 2. Crear usuario en auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: request.email,
      password: generateTemporaryPassword(),
      email_confirm: true,
      user_metadata: {
        full_name: request.full_name,
      },
    })

    if (authError) {
      console.error('Error creando usuario auth:', authError)
      // Limpiar compañía creada
      await supabaseAdmin.from('companies').delete().eq('id', companyId)
      return { success: false, error: `Error creando usuario: ${authError.message}` }
    }

    const userId = authData.user.id

    // 3. Crear perfil de usuario como company_owner
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId,
        email: request.email,
        full_name: request.full_name,
        role: 'company_owner',
        company_id: companyId,
        status: 'active'
      })

    if (profileError) {
      console.error('Error creando perfil de usuario:', profileError)
      // Limpiar registros creados
      await supabaseAdmin.auth.admin.deleteUser(userId)
      await supabaseAdmin.from('companies').delete().eq('id', companyId)
      return { success: false, error: `Error creando perfil: ${profileError.message}` }
    }

    return { 
      success: true, 
      details: { 
        userId, 
        companyId,
        companyName,
        role: 'company_owner',
        message: `Nueva compañía "${companyName}" creada con éxito` 
      } 
    }

  } catch (error) {
    console.error('Error en createNewCompany:', error)
    return { success: false, error: 'Error interno creando compañía' }
  }
}

// Función para rechazar solicitud
async function rejectRequest(request: any, notes?: string) {
  try {
    console.log('❌ Rechazando solicitud:', request.id)
    
    return { 
      success: true, 
      details: { 
        message: 'Solicitud rechazada',
        notes: notes || 'Sin notas adicionales'
      } 
    }

  } catch (error) {
    console.error('Error en rejectRequest:', error)
    return { success: false, error: 'Error interno rechazando solicitud' }
  }
}

// Función para generar contraseña temporal
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
} 