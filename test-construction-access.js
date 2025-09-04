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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConstructionAccess() {
  console.log('🔍 Probando acceso al módulo construcción...');
  
  // 1. Obtener company_id de Inted
  const { data: company } = await supabase
    .from('companies')
    .select('id, name')
    .eq('name', 'Inted')
    .single();
    
  if (!company) {
    console.log('❌ No se encontró la empresa Inted');
    return;
  }
  
  console.log('✅ Empresa encontrada:', company);
  
  // 2. Verificar proyectos de construcción
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name, company_id')
    .eq('company_id', company.id);
    
  if (projectsError) {
    console.log('❌ Error obteniendo proyectos:', projectsError.message);
    return;
  }
  
  console.log(`📊 Proyectos encontrados: ${projects.length}`);
  projects.forEach(p => console.log(`  - ${p.name} (${p.id})`));
  
  // 3. Verificar clientes
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, name, company_id')
    .eq('company_id', company.id);
    
  if (clientsError) {
    console.log('❌ Error obteniendo clientes:', clientsError.message);
    return;
  }
  
  console.log(`👥 Clientes encontrados: ${clients.length}`);
  clients.forEach(c => console.log(`  - ${c.name} (${c.id})`));
  
  // 4. URL correcta para acceder
  const correctUrl = `http://localhost:3000/workspace/construccion?company_id=${company.id}`;
  console.log('\n🚀 URL correcta para acceder al módulo construcción:');
  console.log(correctUrl);
  
  // 5. Verificar que el usuario tiene acceso a este módulo
  const { data: modules } = await supabase
    .from('company_modules')
    .select('module_name')
    .eq('company_id', company.id)
    .eq('is_active', true);
    
  console.log('\n🔧 Módulos activos para Inted:');
  modules?.forEach(m => console.log(`  - ${m.module_name}`));
  
  const hasConstruction = modules?.some(m => m.module_name === 'construccion');
  console.log(`\n${hasConstruction ? '✅' : '❌'} Módulo construcción ${hasConstruction ? 'ACTIVO' : 'NO ACTIVO'} para Inted`);
}

testConstructionAccess().catch(console.error);