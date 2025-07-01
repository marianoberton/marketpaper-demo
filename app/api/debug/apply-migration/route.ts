import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Aplicando migración registration_requests...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Crear tabla directamente con SQL básico
    console.log('📝 Creando tabla registration_requests...')
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.registration_requests (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        full_name text NOT NULL,
        email text NOT NULL,
        company_name text NOT NULL,
        phone text NOT NULL,
        status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
        requested_at timestamptz DEFAULT now(),
        processed_at timestamptz NULL,
        processed_by uuid NULL,
        notes text NULL,
        metadata jsonb DEFAULT '{}'::jsonb,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `
    
    // Intentar crear usando método directo de SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: createTableSQL })
    })
    
    if (!response.ok) {
      // Intentar método alternativo
      console.log('🔄 Intentando método alternativo...')
      
      // Usar el SQL edge function o crear tabla manualmente
      const manualSQL = `
        CREATE TABLE public.registration_requests (
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
        
        CREATE POLICY "Anyone can insert registration requests" ON public.registration_requests
        FOR INSERT WITH CHECK (true);
      `
      
      // Usar PostgREST direct
      const directResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/vnd.pgrst.object+json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: manualSQL
      })
      
      if (!directResponse.ok) {
        const errorText = await directResponse.text()
        return NextResponse.json({
          error: 'No se pudo crear la tabla',
          details: errorText,
          originalError: await response.text()
        }, { status: 500 })
      }
    }
    
    // Verificar que la tabla existe
    console.log('🔍 Verificando que la tabla fue creada...')
    const { data: verifyData, error: verifyError } = await supabase
      .from('registration_requests')
      .select('count', { count: 'exact', head: true })
    
    if (verifyError) {
      console.error('❌ Tabla aún no existe:', verifyError)
      return NextResponse.json({
        error: 'Tabla no se creó correctamente',
        details: verifyError
      }, { status: 500 })
    }
    
    console.log('✅ ¡Tabla creada exitosamente!')
    
    return NextResponse.json({
      success: true,
      message: 'Tabla registration_requests creada exitosamente',
      tableExists: true
    }, { status: 200 })
    
  } catch (error) {
    console.error('❌ Error creando tabla:', error)
    return NextResponse.json({
      error: 'Error interno creando tabla',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 