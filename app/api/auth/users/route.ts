import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createUser, updateUser, deleteUser, getCompanyUsers, UserRole } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar permisos
    if (!currentUser.permissions.includes('manage_users')) {
      return NextResponse.json({ error: 'Sin permisos para gestionar usuarios' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    
    // Si es super admin, puede ver usuarios de cualquier compañía
    let targetCompanyId = companyId
    if (!targetCompanyId) {
      if (currentUser.role === 'super_admin') {
        // Si no se especifica compañía y es super admin, usar la primera disponible
        const supabase = await createClient()
        const { data: companies } = await supabase
          .from('companies')
          .select('id')
          .limit(1)
        
        if (companies && companies.length > 0) {
          targetCompanyId = companies[0].id
        }
      } else {
        // Para usuarios normales, usar su propia compañía
        targetCompanyId = currentUser.company_id || null
      }
    }

    if (!targetCompanyId) {
      return NextResponse.json({ error: 'No se encontró una compañía' }, { status: 400 })
    }

    // Verificar que el usuario puede acceder a esta compañía
    if (currentUser.role !== 'super_admin' && currentUser.company_id !== targetCompanyId) {
      return NextResponse.json({ error: 'Sin permisos para acceder a esta compañía' }, { status: 403 })
    }

    const users = await getCompanyUsers(targetCompanyId)
    return NextResponse.json({ users })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar permisos
    if (!currentUser.permissions.includes('manage_users')) {
      return NextResponse.json({ error: 'Sin permisos para crear usuarios' }, { status: 403 })
    }

    const userData = await request.json()

    // Validar datos requeridos
    if (!userData.email?.trim() || !userData.full_name?.trim() || !userData.role) {
      return NextResponse.json({ error: 'Email, nombre completo y rol son requeridos' }, { status: 400 })
    }

    // Validar email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userData.email)) {
      return NextResponse.json({ error: 'Formato de email inválido' }, { status: 400 })
    }

    // Verificar que el usuario puede asignar este rol
    const requestedRole = userData.role as UserRole
    if (requestedRole === 'super_admin' && currentUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Sin permisos para crear super admins' }, { status: 403 })
    }
    
    if (requestedRole === 'company_owner' && !['super_admin', 'company_owner'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Sin permisos para crear propietarios de compañía' }, { status: 403 })
    }

    // Determinar la compañía
    let targetCompanyId = userData.company_id
    if (!targetCompanyId) {
      if (currentUser.role === 'super_admin') {
        return NextResponse.json({ error: 'Debe especificar una compañía' }, { status: 400 })
      } else {
        targetCompanyId = currentUser.company_id
      }
    }

    // Verificar que el usuario puede crear usuarios en esta compañía
    if (currentUser.role !== 'super_admin' && currentUser.company_id !== targetCompanyId) {
      return NextResponse.json({ error: 'Sin permisos para crear usuarios en esta compañía' }, { status: 403 })
    }

    // Generar contraseña temporal
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()

    const result = await createUser({
      email: userData.email,
      password: tempPassword,
      full_name: userData.full_name,
      role: requestedRole,
      company_id: targetCompanyId
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // En un sistema real, aquí enviarías un email con la contraseña temporal
    console.log(`Usuario creado: ${userData.email} - Contraseña temporal: ${tempPassword}`)

    return NextResponse.json({ 
      user: result.user,
      tempPassword // Solo para desarrollo - en producción esto se enviaría por email
    }, { status: 201 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar permisos
    if (!currentUser.permissions.includes('manage_users')) {
      return NextResponse.json({ error: 'Sin permisos para actualizar usuarios' }, { status: 403 })
    }

    const updateData = await request.json()

    if (!updateData.id) {
      return NextResponse.json({ error: 'ID del usuario es requerido' }, { status: 400 })
    }

    // Verificar que el usuario puede actualizar este usuario
    const supabase = await createClient()
    const { data: targetUser } = await supabase
      .from('user_profiles')
      .select('company_id, role')
      .eq('id', updateData.id)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar permisos de compañía
    if (currentUser.role !== 'super_admin' && currentUser.company_id !== targetUser.company_id) {
      return NextResponse.json({ error: 'Sin permisos para actualizar este usuario' }, { status: 403 })
    }

    // Verificar permisos de rol si se está cambiando
    if (updateData.role) {
      const newRole = updateData.role as UserRole
      
      if (newRole === 'super_admin' && currentUser.role !== 'super_admin') {
        return NextResponse.json({ error: 'Sin permisos para asignar rol de super admin' }, { status: 403 })
      }
      
      if (newRole === 'company_owner' && !['super_admin', 'company_owner'].includes(currentUser.role)) {
        return NextResponse.json({ error: 'Sin permisos para asignar rol de propietario' }, { status: 403 })
      }
    }

    const result = await updateUser(updateData.id, updateData)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ user: result.user })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar permisos
    if (!currentUser.permissions.includes('manage_users') || !currentUser.permissions.includes('delete')) {
      return NextResponse.json({ error: 'Sin permisos para eliminar usuarios' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'ID del usuario es requerido' }, { status: 400 })
    }

    // No permitir que un usuario se elimine a sí mismo
    if (userId === currentUser.id) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 })
    }

    // Verificar que el usuario puede eliminar este usuario
    const supabase = await createClient()
    const { data: targetUser } = await supabase
      .from('user_profiles')
      .select('company_id, role, email')
      .eq('id', userId)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar permisos de compañía
    if (currentUser.role !== 'super_admin' && currentUser.company_id !== targetUser.company_id) {
      return NextResponse.json({ error: 'Sin permisos para eliminar este usuario' }, { status: 403 })
    }

    // No permitir eliminar otros super admins (solo super admin puede eliminar super admin)
    if (targetUser.role === 'super_admin' && currentUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Sin permisos para eliminar super admins' }, { status: 403 })
    }

    // No permitir eliminar company owners si no eres super admin o company owner
    if (targetUser.role === 'company_owner' && !['super_admin', 'company_owner'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Sin permisos para eliminar propietarios de compañía' }, { status: 403 })
    }

    const result = await deleteUser(userId)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ message: 'Usuario eliminado exitosamente' })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 