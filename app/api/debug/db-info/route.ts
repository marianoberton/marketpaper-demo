import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Obtener variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: 'Faltan variables de entorno para Supabase',
        env: {
          NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? '✅ Configurado' : '❌ Falta',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? '✅ Configurado' : '❌ Falta',
        }
      }, { status: 500 });
    }
    
    // Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verificar conexión
    const { data: connectionTest, error: connectionError } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
      
    if (connectionError) {
      return NextResponse.json({
        error: 'Error de conexión a Supabase',
        details: connectionError,
        env: {
          NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? '✅ Configurado (oculto)' : '❌ Falta',
        }
      }, { status: 500 });
    }
    
    // Obtener información de esquemas
    const { data: schemas, error: schemasError } = await supabase
      .rpc('get_schemas_info');
      
    // Obtener información de tablas
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables_info');
    
    return NextResponse.json({
      status: 'Conexión exitosa',
      url: supabaseUrl,
      connectionTest,
      schemas: schemas || { error: schemasError },
      tables: tables || { error: tablesError },
      env: {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? '✅ Configurado (oculto)' : '❌ Falta',
        NODE_ENV: process.env.NODE_ENV,
      }
    });
  } catch (error: any) {
    console.error('Error en diagnóstico de DB:', error);
    return NextResponse.json({
      error: 'Error en diagnóstico de DB',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}