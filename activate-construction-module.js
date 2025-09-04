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

async function activateConstructionModule() {
  console.log('🔧 Activando módulo construcción para Inted...');
  
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
  
  // 2. Verificar si el módulo construcción existe en la tabla modules
  const { data: module } = await supabase
    .from('modules')
    .select('id, name')
    .eq('name', 'construccion')
    .single();
    
  if (!module) {
    console.log('❌ No se encontró el módulo construcción en la tabla modules');
    return;
  }
  
  console.log('✅ Módulo construcción encontrado:', module);
  
  // 3. Verificar si ya existe la relación company_modules
  const { data: existingRelation } = await supabase
    .from('company_modules')
    .select('*')
    .eq('company_id', company.id)
    .eq('module_id', module.id)
    .single();
    
  if (existingRelation) {
    console.log('🔄 Relación ya existe, actualizando a activo...');
    
    const { error: updateError } = await supabase
      .from('company_modules')
      .update({ is_active: true })
      .eq('company_id', company.id)
      .eq('module_id', module.id);
      
    if (updateError) {
      console.log('❌ Error actualizando relación:', updateError.message);
      return;
    }
    
    console.log('✅ Módulo construcción ACTIVADO para Inted');
  } else {
    console.log('➕ Creando nueva relación company_modules...');
    
    const { error: insertError } = await supabase
      .from('company_modules')
      .insert({
        company_id: company.id,
        module_id: module.id,
        is_active: true
      });
      
    if (insertError) {
      console.log('❌ Error creando relación:', insertError.message);
      return;
    }
    
    console.log('✅ Módulo construcción ACTIVADO para Inted');
  }
  
  // 4. Verificar que se activó correctamente
  const { data: verification } = await supabase
    .from('company_modules')
    .select('module_name')
    .eq('company_id', company.id)
    .eq('is_active', true);
    
  console.log('\n🔧 Módulos activos para Inted después de la activación:');
  verification?.forEach(m => console.log(`  - ${m.module_name}`));
  
  const hasConstruction = verification?.some(m => m.module_name === 'construccion');
  console.log(`\n${hasConstruction ? '✅' : '❌'} Módulo construcción ${hasConstruction ? 'ACTIVO' : 'NO ACTIVO'} para Inted`);
  
  if (hasConstruction) {
    const correctUrl = `http://localhost:3000/workspace/construccion?company_id=${company.id}`;
    console.log('\n🚀 Ahora puedes acceder al módulo construcción en:');
    console.log(correctUrl);
  }
}

activateConstructionModule().catch(console.error);