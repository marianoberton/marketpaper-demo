import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    console.log('🔍 Verificando compañías en la base de datos...')

    // Query raw para ver qué hay
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('📊 Compañías encontradas:', companies?.length || 0)
    console.log('📋 Lista de compañías:', companies)

    if (companiesError) {
      console.error('❌ Error obteniendo compañías:', companiesError)
      return NextResponse.json({ 
        error: companiesError.message,
        details: companiesError
      }, { status: 500 })
    }

    // Verificar también la tabla super_admins
    const { data: superAdmins, error: adminError } = await supabaseAdmin
      .from('super_admins')
      .select('*')

    console.log('👑 Super admins encontrados:', superAdmins?.length || 0)

    return NextResponse.json({
      success: true,
      companies: companies || [],
      companyCount: companies?.length || 0,
      superAdmins: superAdmins || [],
      adminCount: superAdmins?.length || 0
    })

  } catch (error) {
    console.error('💥 Error en debug companies:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 