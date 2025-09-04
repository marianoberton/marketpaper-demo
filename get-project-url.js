const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Leer variables de entorno
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

// Crear cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getProjectUrl() {
  try {
    console.log('🔍 Buscando proyectos de Inted para probar upload...');
    
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, company_id')
      .eq('company_id', '57bffb9f-78ba-4252-a9ea-10adf83c3155')
      .limit(3);
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    if (data.length === 0) {
      console.log('❌ No se encontraron proyectos de Inted');
      return;
    }
    
    console.log('✅ Proyectos encontrados:');
    data.forEach(p => console.log(`  - ${p.name} (ID: ${p.id})`));
    console.log('');
    console.log('🌐 URL de prueba para upload de documentos:');
    console.log(`http://localhost:3000/workspace/construccion/projects/${data[0].id}?company_id=57bffb9f-78ba-4252-a9ea-10adf83c3155`);
    console.log('');
    console.log('📋 Instrucciones:');
    console.log('1. Abre la URL en tu navegador');
    console.log('2. Ve a la sección de documentos');
    console.log('3. Intenta subir un archivo');
    console.log('4. Revisa la consola del navegador para ver los logs de depuración');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

getProjectUrl();