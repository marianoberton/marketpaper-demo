import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Verificando configuración de variables de entorno...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('📊 Variables de entorno:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? `✅ Set (${supabaseUrl.length} chars)` : '❌ Missing')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? `✅ Set (${supabaseAnonKey.length} chars)` : '❌ Missing')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? `✅ Set (${supabaseServiceKey.length} chars)` : '❌ Missing')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Variables de entorno faltantes',
        details: {
          url: !!supabaseUrl,
          serviceKey: !!supabaseServiceKey,
          anonKey: !!supabaseAnonKey
        }
      }, { status: 500 })
    }
    
    // Test básico de conexión con service role
    console.log('🌐 Testing basic network connectivity...')
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        }
      })
      
      console.log('Network response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Network error response:', errorText)
        return NextResponse.json({
          error: 'Network connectivity issue',
          status: response.status,
          response: errorText
        }, { status: 500 })
      }
      
    } catch (networkError) {
      console.error('Network error:', networkError)
      return NextResponse.json({
        error: 'Network connection failed',
        details: networkError instanceof Error ? networkError.message : 'Unknown network error'
      }, { status: 500 })
    }
    
    // Test de Supabase client
    console.log('📱 Testing Supabase client creation...')
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('Supabase client created successfully')
    
    // Test de tabla específica
    console.log('🗄️ Testing table access...')
    const { data, error, count } = await supabase
      .from('registration_requests')
      .select('*', { count: 'exact' })
      .limit(1)
    
    console.log('Table query result:', { data, error, count })
    
    if (error) {
      console.error('Table access error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      return NextResponse.json({
        envOk: true,
        networkOk: true,
        clientOk: true,
        tableOk: false,
        tableError: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }
      }, { status: 200 })
    }
    
    return NextResponse.json({
      envOk: true,
      networkOk: true,
      clientOk: true,
      tableOk: true,
      tableCount: count,
      sampleData: data
    }, { status: 200 })
    
  } catch (error) {
    console.error('❌ Error en diagnóstico de entorno:', error)
    return NextResponse.json({
      error: 'Error interno en diagnóstico',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 