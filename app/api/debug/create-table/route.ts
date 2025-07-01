import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Creando tabla registration_requests...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Usar RPC para ejecutar SQL directo
    console.log('📝 Ejecutando CREATE TABLE con RPC...')
    
    const { data, error } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.registration_requests (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          full_name text NOT NULL,
          email text NOT NULL,
          company_name text NOT NULL,
          phone text NOT NULL,
          status text DEFAULT 'pending',
          requested_at timestamptz DEFAULT now(),
          processed_at timestamptz NULL,
          processed_by uuid NULL,
          notes text NULL,
          metadata jsonb DEFAULT '{}'::jsonb,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
        
        ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Anyone can insert registration requests" ON public.registration_requests;
        CREATE POLICY "Anyone can insert registration requests" 
        ON public.registration_requests FOR INSERT WITH CHECK (true);
      `
    })
    
    console.log('RPC Result:', { data, error })
    
    if (error) {
      console.error('❌ Error ejecutando RPC:', error)
      return NextResponse.json({
        error: 'Error ejecutando SQL con RPC',
        details: error
      }, { status: 500 })
    }
    
    // Verificar que la tabla existe
    console.log('🔍 Verificando que la tabla fue creada...')
    const { data: verifyData, error: verifyError } = await supabase
      .from('registration_requests')
      .select('count', { count: 'exact', head: true })
    
    if (verifyError) {
      console.error('❌ Error verificando tabla:', verifyError)
      return NextResponse.json({
        error: 'Error verificando tabla después de creación',
        details: verifyError,
        rpcResult: { data, error }
      }, { status: 500 })
    }
    
    console.log('✅ ¡Tabla creada y verificada exitosamente!')
    
    return NextResponse.json({
      success: true,
      message: 'Tabla registration_requests creada exitosamente',
      tableExists: true,
      rpcResult: { data, error }
    }, { status: 200 })
    
  } catch (error) {
    console.error('❌ Error creando tabla:', error)
    return NextResponse.json({
      error: 'Error interno creando tabla',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 