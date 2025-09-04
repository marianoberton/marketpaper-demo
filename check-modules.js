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

async function checkModules() {
  console.log('🔍 Verificando módulos disponibles...');
  
  // 1. Listar todos los módulos
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('*')
    .order('name');
    
  if (modulesError) {
    console.log('❌ Error obteniendo módulos:', modulesError.message);
    return;
  }
  
  console.log(`📋 Módulos encontrados en la tabla modules: ${modules.length}`);
  modules.forEach(m => console.log(`  - ${m.name} (${m.id}) - ${m.display_name || 'Sin nombre'}`));
  
  // 2. Verificar si existe 'construccion'
  const constructionModule = modules.find(m => m.name === 'construccion');
  
  if (!constructionModule) {
    console.log('\n❌ Módulo "construccion" NO encontrado');
    console.log('\n🔧 Creando módulo construcción...');
    
    const { data: newModule, error: createError } = await supabase
      .from('modules')
      .insert({
        name: 'construccion',
        display_name: 'Construcción',
        description: 'Módulo de gestión de proyectos de construcción',
        icon: 'Building2',
        category: 'business',
        is_active: true
      })
      .select()
      .single();
      
    if (createError) {
      console.log('❌ Error creando módulo construcción:', createError.message);
      return;
    }
    
    console.log('✅ Módulo construcción creado:', newModule);
    
    // 3. Ahora activar para Inted
    const { data: company } = await supabase
      .from('companies')
      .select('id, name')
      .eq('name', 'Inted')
      .single();
      
    if (company) {
      const { error: activateError } = await supabase
        .from('company_modules')
        .insert({
          company_id: company.id,
          module_id: newModule.id,
          is_active: true
        });
        
      if (activateError) {
        console.log('❌ Error activando módulo para Inted:', activateError.message);
      } else {
        console.log('✅ Módulo construcción ACTIVADO para Inted');
        console.log(`\n🚀 URL para acceder: http://localhost:3000/workspace/construccion?company_id=${company.id}`);
      }
    }
  } else {
    console.log('\n✅ Módulo "construccion" encontrado:', constructionModule);
    
    // Verificar si está activo para Inted
    const { data: company } = await supabase
      .from('companies')
      .select('id, name')
      .eq('name', 'Inted')
      .single();
      
    if (company) {
      const { data: companyModule } = await supabase
        .from('company_modules')
        .select('*')
        .eq('company_id', company.id)
        .eq('module_id', constructionModule.id)
        .single();
        
      if (companyModule) {
        console.log(`\n${companyModule.is_active ? '✅' : '❌'} Módulo ${companyModule.is_active ? 'ACTIVO' : 'INACTIVO'} para Inted`);
        
        if (!companyModule.is_active) {
          const { error: updateError } = await supabase
            .from('company_modules')
            .update({ is_active: true })
            .eq('company_id', company.id)
            .eq('module_id', constructionModule.id);
            
          if (updateError) {
            console.log('❌ Error activando módulo:', updateError.message);
          } else {
            console.log('✅ Módulo construcción ACTIVADO para Inted');
          }
        }
      } else {
        console.log('\n➕ Creando relación company_modules...');
        
        const { error: insertError } = await supabase
          .from('company_modules')
          .insert({
            company_id: company.id,
            module_id: constructionModule.id,
            is_active: true
          });
          
        if (insertError) {
          console.log('❌ Error creando relación:', insertError.message);
        } else {
          console.log('✅ Módulo construcción ACTIVADO para Inted');
        }
      }
      
      console.log(`\n🚀 URL para acceder: http://localhost:3000/workspace/construccion?company_id=${company.id}`);
    }
  }
}

checkModules().catch(console.error);