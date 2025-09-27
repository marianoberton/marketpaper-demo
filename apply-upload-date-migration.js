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
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔧 Verificando estado de la columna upload_date...');
  
  try {
    // Intentar insertar un registro de prueba para verificar si la columna existe
    console.log('1. Probando inserción con upload_date...');
    const { data: testInsert, error: testError } = await supabase
      .from('project_documents')
      .insert({
        project_id: '00000000-0000-0000-0000-000000000000', // UUID falso para test
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
      
    if (testError) {
      if (testError.message.includes("upload_date")) {
        console.log('❌ La columna upload_date NO existe en la base de datos');
        console.log('🔧 Necesitamos aplicar la migración manualmente...');
        
        // Mostrar instrucciones para aplicar manualmente
        console.log('\n📋 INSTRUCCIONES PARA APLICAR LA MIGRACIÓN MANUALMENTE:');
        console.log('1. Ve al panel de Supabase (https://supabase.com/dashboard)');
        console.log('2. Selecciona tu proyecto');
        console.log('3. Ve a "SQL Editor"');
        console.log('4. Ejecuta el siguiente SQL:');
        console.log('\n--- COPIAR Y PEGAR EN SUPABASE SQL EDITOR ---');
        console.log('ALTER TABLE project_documents ADD COLUMN IF NOT EXISTS upload_date DATE;');
        console.log('CREATE INDEX IF NOT EXISTS idx_project_documents_upload_date ON project_documents(upload_date);');
        console.log("COMMENT ON COLUMN project_documents.upload_date IS 'Fecha de carga del documento, utilizada para calcular fechas de vencimiento';");
        console.log('--- FIN DEL SQL ---\n');
        console.log('5. Después de ejecutar el SQL, reinicia el servidor de desarrollo (npm run dev)');
        
      } else {
        console.log('❌ Error diferente:', testError.message);
      }
      return;
    } else {
      console.log('✅ ¡La columna upload_date existe y funciona correctamente!');
      // Limpiar el registro de prueba si se insertó
      if (testInsert && testInsert.length > 0) {
        await supabase
          .from('project_documents')
          .delete()
          .eq('id', testInsert[0].id);
        console.log('✅ Registro de prueba eliminado');
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

applyMigration().catch(console.error);