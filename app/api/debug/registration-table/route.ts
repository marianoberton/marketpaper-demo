import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    console.log('🔍 Iniciando diagnóstico de registration_requests...')
    
    // Test 1: Verificar conexión básica
    console.log('📡 Test 1: Conexión a Supabase')
    const { data: ping, error: pingError } = await supabase
      .from('companies')
      .select('count', { count: 'exact', head: true })
    
    if (pingError) {
      console.error('❌ Error de conexión:', pingError)
      return NextResponse.json({
        error: 'Error de conexión a Supabase',
        details: pingError
      }, { status: 500 })
    }
    
    console.log('✅ Test 1 exitoso: Conexión establecida')
    
    // Test 2: Verificar que la tabla registration_requests existe
    console.log('📊 Test 2: Verificando tabla registration_requests')
    const { data: tableData, error: tableError } = await supabase
      .from('registration_requests')
      .select('count', { count: 'exact', head: true })
    
    if (tableError) {
      console.error('❌ Error accediendo tabla:', tableError)
      return NextResponse.json({
        error: 'La tabla registration_requests no existe o no es accesible',
        details: tableError,
        tableExists: false
      }, { status: 200 })
    }
    
    console.log('✅ Test 2 exitoso: Tabla accesible, registros:', tableData)
    
    // Test 3: Intentar inserción de prueba
    console.log('📝 Test 3: Prueba de inserción')
    const testData = {
      full_name: 'Test Debug User',
      email: 'debug-test@example.com',
      company_name: 'Debug Test Company',
      phone: '+1234567890',
      status: 'pending',
      requested_at: new Date().toISOString(),
      metadata: {
        test: true,
        debug: true,
        timestamp: Date.now()
      }
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('registration_requests')
      .insert(testData)
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Error en inserción de prueba:', {
        error: insertError,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      
      return NextResponse.json({
        tableExists: true,
        connectionOk: true,
        insertOk: false,
        insertError: insertError,
        diagnosis: 'La tabla existe pero hay problemas con la inserción'
      }, { status: 200 })
    }
    
    console.log('✅ Test 3 exitoso: Inserción realizada', insertData)
    
    // Si llegamos aquí, todo funciona
    return NextResponse.json({
      tableExists: true,
      connectionOk: true,
      insertOk: true,
      insertedData: insertData,
      diagnosis: 'Todo funciona correctamente'
    }, { status: 200 })
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error)
    return NextResponse.json({
      error: 'Error interno en diagnóstico',
      details: error
    }, { status: 500 })
  }
} 