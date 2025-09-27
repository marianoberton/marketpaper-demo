const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Cargar variables de entorno
const envContent = fs.readFileSync('.env', 'utf8');
const envLines = envContent.split('\n');
envLines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...parts] = trimmed.split('=');
    if (key && parts.length > 0) {
      process.env[key] = parts.join('=').replace(/^[\"']|[\"']$/g, '');
    }
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurada en .env');
  console.log('💡 Asegúrate de tener esta variable en tu archivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addUploadDateColumn() {
  console.log('🔧 Agregando columna upload_date a project_documents...');
  
  try {
    // Ejecutar el SQL directamente usando una consulta raw
    console.log('1. Ejecutando ALTER TABLE...');
    
    const { data, error } = await supabase
      .from('project_documents')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Error conectando a la tabla:', error);
      return;
    }
    
    console.log('✅ Conexión a project_documents exitosa');
    
    // Usar una función SQL personalizada para ejecutar DDL
    console.log('2. Creando función temporal para ejecutar DDL...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION add_upload_date_column()
      RETURNS TEXT AS $$
      BEGIN
        -- Verificar si la columna ya existe
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'project_documents' 
          AND column_name = 'upload_date'
        ) THEN
          -- Agregar la columna
          ALTER TABLE project_documents ADD COLUMN upload_date DATE;
          
          -- Crear índice
          CREATE INDEX idx_project_documents_upload_date ON project_documents(upload_date);
          
          -- Agregar comentario
          COMMENT ON COLUMN project_documents.upload_date IS 'Fecha de carga del documento, utilizada para calcular fechas de vencimiento';
          
          RETURN 'Columna upload_date agregada exitosamente';
        ELSE
          RETURN 'La columna upload_date ya existe';
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    // Ejecutar usando rpc
    const { data: createResult, error: createError } = await supabase.rpc('exec', {
      sql: createFunctionSQL
    });
    
    if (createError) {
      console.log('⚠️  No se pudo crear la función, intentando método alternativo...');
      
      // Método alternativo: usar una inserción que falle para ejecutar SQL
      console.log('3. Usando método alternativo...');
      
      // Primero verificar si la columna existe intentando usarla
      const { data: testData, error: testError } = await supabase
        .from('project_documents')
        .insert({
          project_id: '00000000-0000-0000-0000-000000000000',
          section_name: 'test',
          filename: 'test',
          original_filename: 'test', 
          file_url: 'test',
          file_size: 0,
          mime_type: 'test',
          uploaded_by: 'test',
          upload_date: '2025-01-01'
        })
        .select();
        
      if (testError && testError.message.includes('upload_date')) {
        console.log('❌ La columna upload_date NO existe');
        console.log('\n🚨 NECESITAS EJECUTAR ESTE SQL MANUALMENTE EN SUPABASE:');
        console.log('\n--- COPIA Y PEGA EN SUPABASE SQL EDITOR ---');
        console.log('ALTER TABLE project_documents ADD COLUMN upload_date DATE;');
        console.log('CREATE INDEX idx_project_documents_upload_date ON project_documents(upload_date);');
        console.log("COMMENT ON COLUMN project_documents.upload_date IS 'Fecha de carga del documento, utilizada para calcular fechas de vencimiento';");
        console.log('--- FIN DEL SQL ---\n');
        console.log('📋 PASOS:');
        console.log('1. Ve a https://supabase.com/dashboard');
        console.log('2. Selecciona tu proyecto');
        console.log('3. Ve a "SQL Editor"');
        console.log('4. Pega y ejecuta el SQL de arriba');
        console.log('5. Ejecuta este script nuevamente para verificar');
        
      } else if (!testError) {
        console.log('✅ ¡La columna upload_date ya existe y funciona!');
        // Limpiar el registro de prueba
        if (testData && testData.length > 0) {
          await supabase
            .from('project_documents')
            .delete()
            .eq('id', testData[0].id);
        }
      } else {
        console.log('❌ Error diferente:', testError.message);
      }
      
      return;
    }
    
    // Si llegamos aquí, ejecutar la función
    console.log('4. Ejecutando función para agregar columna...');
    const { data: execResult, error: execError } = await supabase.rpc('add_upload_date_column');
    
    if (execError) {
      console.error('❌ Error ejecutando función:', execError);
      return;
    }
    
    console.log('✅', execResult);
    
    // Verificar que funciona
    console.log('5. Verificando que la columna funciona...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('project_documents')
      .insert({
        project_id: '00000000-0000-0000-0000-000000000000',
        section_name: 'test_verification',
        filename: 'test',
        original_filename: 'test',
        file_url: 'test',
        file_size: 0,
        mime_type: 'test',
        uploaded_by: 'test',
        upload_date: '2025-01-01'
      })
      .select();
      
    if (verifyError) {
      console.error('❌ Error en verificación:', verifyError);
    } else {
      console.log('✅ Verificación exitosa - la columna upload_date funciona correctamente');
      // Limpiar registro de prueba
      if (verifyData && verifyData.length > 0) {
        await supabase
          .from('project_documents')
          .delete()
          .eq('id', verifyData[0].id);
        console.log('✅ Registro de prueba eliminado');
      }
    }
    
    // Limpiar función temporal
    await supabase.rpc('exec', {
      sql: 'DROP FUNCTION IF EXISTS add_upload_date_column();'
    });
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

console.log('🚀 Iniciando proceso para agregar columna upload_date...');
addUploadDateColumn().catch(console.error);