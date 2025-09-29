import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id es requerido' },
        { status: 400 }
      )
    }

    // Obtener clientes de la empresa específica
    const { data: clients, error } = await supabaseAdmin
      .from('clients')
      .select(`
        id,
        name,
        email,
        contact_person,
        company_id
      `)
      .eq('company_id', companyId)
      .order('name')

    if (error) {
      console.error('Error obteniendo clientes:', error)
      return NextResponse.json(
        { error: 'Error obteniendo clientes' },
        { status: 500 }
      )
    }

    return NextResponse.json(clients || [])

  } catch (error) {
    console.error('Error en API de clientes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}