import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// PUT - Toggle client portal for a company (Super Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: companyId } = await params

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Verify super admin by checking role in user_profiles
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Solo super admins pueden gestionar esta configuración' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { client_portal_enabled } = body

    if (typeof client_portal_enabled !== 'boolean') {
      return NextResponse.json({ error: 'client_portal_enabled debe ser un boolean' }, { status: 400 })
    }

    // Update company portal setting
    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update({ client_portal_enabled })
      .eq('id', companyId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating company portal setting:', updateError)
      return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 })
    }

    return NextResponse.json({ company: updatedCompany })
  } catch (error: any) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
