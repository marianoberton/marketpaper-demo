import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    
    console.log('🔧 Creando datos de prueba...')
    
    // Insertar empresa de prueba
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .upsert({
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Test Company',
        slug: 'test-company',
        status: 'active'
      })
      .select()
      .single()
    
    if (companyError && companyError.code !== '23505') { // 23505 = unique violation (already exists)
      console.error('Error creando empresa:', companyError)
      return NextResponse.json({ error: 'Error creando empresa de prueba', details: companyError }, { status: 500 })
    }
    
    console.log('✅ Empresa de prueba creada/verificada')
    
    // Insertar cliente de prueba
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .upsert({
        id: '22222222-2222-2222-2222-222222222222',
        company_id: '11111111-1111-1111-1111-111111111111',
        name: 'Cliente de Prueba',
        email: 'cliente@test.com',
        phone: '+1234567890',
        address: 'Dirección de prueba 123'
      })
      .select()
      .single()
    
    if (clientError && clientError.code !== '23505') {
      console.error('Error creando cliente:', clientError)
      return NextResponse.json({ error: 'Error creando cliente de prueba', details: clientError }, { status: 500 })
    }
    
    console.log('✅ Cliente de prueba creado/verificado')
    
    // Insertar proyecto de prueba
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .upsert({
        id: '33333333-3333-3333-3333-333333333333',
        company_id: '11111111-1111-1111-1111-111111111111',
        name: 'Proyecto de Prueba',
        address: 'Dirección del proyecto de prueba',
        status: 'active'
      })
      .select()
      .single()
    
    if (projectError && projectError.code !== '23505') {
      console.error('Error creando proyecto:', projectError)
      return NextResponse.json({ error: 'Error creando proyecto de prueba', details: projectError }, { status: 500 })
    }
    
    console.log('✅ Proyecto de prueba creado/verificado')
    
    // Insertar secciones del proyecto
    const sections = [
      {
        id: '44444444-4444-4444-4444-444444444444',
        project_id: '33333333-3333-3333-3333-333333333333',
        name: 'verificaciones-prefactibilidad-del-proyecto',
        "order": 1
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        project_id: '33333333-3333-3333-3333-333333333333',
        name: 'documentacion-tecnica',
        "order": 2
      },
      {
        id: '66666666-6666-6666-6666-666666666666',
        project_id: '33333333-3333-3333-3333-333333333333',
        name: 'planos-y-memorias',
        "order": 3
      }
    ]
    
    for (const section of sections) {
      const { error: sectionError } = await supabase
        .from('project_sections')
        .upsert(section)
      
      if (sectionError && sectionError.code !== '23505') {
        console.error('Error creando sección:', sectionError)
        return NextResponse.json({ error: 'Error creando secciones de prueba', details: sectionError }, { status: 500 })
      }
    }
    
    console.log('✅ Secciones de proyecto creadas/verificadas')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Datos de prueba creados exitosamente',
      data: {
        company: '11111111-1111-1111-1111-111111111111',
        client: '22222222-2222-2222-2222-222222222222',
        project: '33333333-3333-3333-3333-333333333333',
        sections: sections.length
      }
    })
    
  } catch (error) {
    console.error('Error general:', error)
    return NextResponse.json({ error: 'Error interno del servidor', details: error }, { status: 500 })
  }
}