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

export async function POST(request: NextRequest) {
  try {
    console.log('🏗️ Creando compañías de ejemplo...')

    const sampleCompanies = [
      {
        name: 'ACME Corporation',
        slug: 'acme-corp',
        contact_email: 'admin@acme.com',
        status: 'active',
        plan: 'professional'
      },
      {
        name: 'TechStart Solutions',
        slug: 'techstart-solutions',
        contact_email: 'contact@techstart.com',
        status: 'active',
        plan: 'starter'
      },
      {
        name: 'Global Industries',
        slug: 'global-industries',
        contact_email: 'info@global.com',
        status: 'active',
        plan: 'enterprise'
      }
    ]

    const results = []

    for (const company of sampleCompanies) {
      // Verificar si ya existe
      const { data: existing } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('slug', company.slug)
        .single()

      if (existing) {
        results.push({ ...company, status: 'already_exists', id: existing.id })
        continue
      }

      // Crear la compañía
      const { data: newCompany, error } = await supabaseAdmin
        .from('companies')
        .insert(company)
        .select()
        .single()

      if (error) {
        console.error(`❌ Error creando ${company.name}:`, error)
        results.push({ ...company, status: 'error', error: error.message })
      } else {
        console.log(`✅ Creada: ${company.name}`)
        results.push({ ...company, status: 'created', id: newCompany.id })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Compañías de ejemplo procesadas',
      results
    })

  } catch (error) {
    console.error('💥 Error creando compañías:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 