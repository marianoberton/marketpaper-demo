import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('id')
    
    // Determinar qué compañía consultar
    let targetCompanyId = companyId
    if (!targetCompanyId) {
      // Si no se especifica ID, usar la compañía del usuario actual
      targetCompanyId = currentUser.company_id || null
    }

    if (!targetCompanyId) {
      return NextResponse.json({ error: 'No se encontró una compañía' }, { status: 400 })
    }

    // Verificar permisos - solo puede ver su propia compañía a menos que sea super admin
    if (currentUser.role !== 'super_admin' && currentUser.company_id !== targetCompanyId) {
      return NextResponse.json({ error: 'Sin permisos para acceder a esta compañía' }, { status: 403 })
    }

    const supabase = await createClient()
    
    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', targetCompanyId)
      .single()

    if (error) {
      console.error('Error fetching company:', error)
      return NextResponse.json({ error: 'Error al cargar la compañía' }, { status: 500 })
    }

    if (!company) {
      return NextResponse.json({ error: 'Compañía no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ company })

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

    // Verificar permisos para actualizar compañía
    if (!currentUser.permissions.includes('manage_company')) {
      return NextResponse.json({ error: 'Sin permisos para actualizar la compañía' }, { status: 403 })
    }

    const updateData = await request.json()

    if (!updateData.id) {
      return NextResponse.json({ error: 'ID de la compañía es requerido' }, { status: 400 })
    }

    // Verificar que puede actualizar esta compañía
    if (currentUser.role !== 'super_admin' && currentUser.company_id !== updateData.id) {
      return NextResponse.json({ error: 'Sin permisos para actualizar esta compañía' }, { status: 403 })
    }

    const supabase = await createClient()
    
    const { data: company, error } = await supabase
      .from('companies')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', updateData.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating company:', error)
      return NextResponse.json({ error: 'Error al actualizar la compañía' }, { status: 500 })
    }

    return NextResponse.json({ company })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 