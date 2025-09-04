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

async function fixConstructionModule() {
  console.log('🔧 Corrigiendo módulo construcción...');
  
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
  
  // 2. Buscar el módulo "Construccion" (con mayúscula)
  const { data: module } = await supabase
    .from('modules')
    .select('id, name')
    .eq('name', 'Construccion')
    .single();
    
  if (!module) {
    console.log('❌ No se encontró el módulo Construccion');
    return;
  }
  
  console.log('✅ Módulo Construccion encontrado:', module);
  
  // 3. Verificar si ya existe la relación company_modules
  const { data: existingRelation } = await supabase
    .from('company_modules')
    .select('*')
    .eq('company_id', company.id)
    .eq('module_id', module.id)
    .single();
    
  if (existingRelation) {
    console.log('🔄 Relación ya existe:', existingRelation);
    
    if (!existingRelation.is_active) {
      console.log('🔄 Activando módulo...');
      
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
      console.log('✅ Módulo construcción ya está ACTIVO para Inted');
    }
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
  
  // 4. Verificar que se activó correctamente usando la vista
  const { data: verification } = await supabase
    .from('company_modules')
    .select(`
      is_active,
      modules!inner(name)
    `)
    .eq('company_id', company.id)
    .eq('is_active', true);
    
  console.log('\n🔧 Módulos activos para Inted después de la activación:');
  verification?.forEach(cm => console.log(`  - ${cm.modules.name}`));
  
  const hasConstruction = verification?.some(cm => 
    cm.modules.name === 'Construccion' || cm.modules.name === 'construccion'
  );
  
  console.log(`\n${hasConstruction ? '✅' : '❌'} Módulo construcción ${hasConstruction ? 'ACTIVO' : 'NO ACTIVO'} para Inted`);
  
  if (hasConstruction) {
    const correctUrl = `http://localhost:3000/workspace/construccion?company_id=${company.id}`;
    console.log('\n🚀 Ahora puedes acceder al módulo construcción en:');
    console.log(correctUrl);
    
    console.log('\n📝 Nota: El módulo se llama "Construccion" en la BD pero la URL usa "construccion" (minúscula)');
  }
}

fixConstructionModule().catch(console.error);