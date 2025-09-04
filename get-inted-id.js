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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getIntedCompanyId() {
  try {
    console.log('🔍 Buscando empresa Inted...');
    
    const { data, error } = await supabase
      .from('companies')
      .select('id, name')
      .eq('name', 'Inted')
      .single();
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    console.log('✅ Empresa Inted encontrada:');
    console.log('   ID:', data.id);
    console.log('   Nombre:', data.name);
    console.log('');
    console.log('🔗 URL correcta para el módulo construcción:');
    console.log('   http://localhost:3000/workspace/construccion?company_id=' + data.id);
    
  } catch (err) {
    console.log('❌ Error inesperado:', err.message);
  }
}

getIntedCompanyId();