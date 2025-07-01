import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    console.log('🔒 Iniciando test de políticas RLS...')
    
    // Test 1: Verificar el usuario actual
    console.log('👤 Test 1: Verificando usuario actual')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('Usuario actual:', user?.id || 'Anónimo')
    console.log('Error de usuario:', userError)
    
    // Test 2: Probar inserción normal (con RLS)
    console.log('🔐 Test 2: Intentando inserción normal (con RLS)')
    
    const testData = {
      full_name: 'RLS Test User',
      email: 'rls-test@example.com',
      company_name: 'RLS Test Company',
      phone: '+1234567890',
      status: 'pending',
      requested_at: new Date().toISOString(),
      metadata: {
        test: true,
        rls_test: true,
        timestamp: Date.now()
      }
    }
    
    const { data: normalData, error: normalError } = await supabase
      .from('registration_requests')
      .insert(testData)
      .select()
      .single()
    
    if (normalError) {
      console.error('❌ Error con RLS normal:', {
        error: normalError,
        message: normalError.message,
        details: normalError.details,
        hint: normalError.hint,
        code: normalError.code
      })
      
      return NextResponse.json({
        rlsOk: false,
        rlsError: {
          message: normalError.message,
          details: normalError.details,
          hint: normalError.hint,
          code: normalError.code
        },
        userInfo: { user: user?.id || 'Anónimo', userError },
        diagnosis: 'El problema es con las políticas RLS'
      }, { status: 200 })
    }
    
    console.log('✅ Test 2 exitoso: Inserción normal funciona')
    
    return NextResponse.json({
      rlsOk: true,
      insertedData: normalData,
      userInfo: { user: user?.id || 'Anónimo', userError },
      diagnosis: 'RLS funciona correctamente'
    }, { status: 200 })
    
  } catch (error) {
    console.error('❌ Error en test RLS:', error)
    return NextResponse.json({
      error: 'Error interno en test RLS',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
} 