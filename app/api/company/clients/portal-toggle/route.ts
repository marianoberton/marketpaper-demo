import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// PUT - Toggle portal access for a client
export async function PUT(request: NextRequest) {
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { clientId, portalEnabled } = body

    if (!clientId || typeof portalEnabled !== 'boolean') {
      return NextResponse.json({ error: 'clientId y portalEnabled son requeridos' }, { status: 400 })
    }

    // Get current user's profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
    }

    // Only company admins and above can manage portal access
    if (!['super_admin', 'company_owner', 'company_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'No tienes permisos para gestionar el portal' }, { status: 403 })
    }

    // Update client portal access
    const { data: updatedClient, error: updateError } = await supabase
      .from('clients')
      .update({ portal_enabled: portalEnabled })
      .eq('id', clientId)
      .eq('company_id', profile.company_id) // Ensure same company
      .select()
      .single()

    if (updateError) {
      console.error('Error updating client portal access:', updateError)
      return NextResponse.json({ error: 'Error al actualizar acceso al portal' }, { status: 500 })
    }

    return NextResponse.json({ client: updatedClient })
  } catch (error: any) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
