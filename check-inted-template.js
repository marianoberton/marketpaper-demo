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

async function checkIntedTemplate() {
  console.log('🔍 Verificando template y features de Inted...');
  
  // 1. Obtener información completa de Inted
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select(`
      id,
      name,
      template_id,
      features,
      client_templates!template_id (
        id,
        name,
        available_features
      )
    `)
    .eq('name', 'Inted')
    .single();
    
  if (companyError || !company) {
    console.log('❌ Error obteniendo empresa Inted:', companyError?.message);
    return;
  }
  
  console.log('✅ Empresa Inted encontrada:');
  console.log('  - ID:', company.id);
  console.log('  - Template ID:', company.template_id || 'Sin template');
  console.log('  - Features:', company.features || 'Sin features');
  
  if (company.client_templates) {
    console.log('  - Template info:', company.client_templates);
  }
  
  // 2. Si tiene template, verificar módulos del template
  if (company.template_id) {
    console.log('\n🔧 Verificando módulos del template...');
    
    const { data: templateModules, error: templateError } = await supabase
      .from('template_modules')
      .select(`
        modules (
          id,
          name,
          route_path,
          icon,
          category
        )
      `)
      .eq('template_id', company.template_id);
      
    if (templateError) {
      console.log('❌ Error obteniendo módulos del template:', templateError.message);
    } else {
      console.log(`📋 Módulos del template: ${templateModules?.length || 0}`);
      templateModules?.forEach(tm => {
        if (tm.modules) {
          console.log(`  - ${tm.modules.name} (${tm.modules.route_path})`);
        }
      });
      
      const hasConstruction = templateModules?.some(tm => 
        tm.modules && (tm.modules.name === 'Construccion' || tm.modules.name === 'construccion')
      );
      console.log(`\n${hasConstruction ? '✅' : '❌'} Módulo construcción ${hasConstruction ? 'ENCONTRADO' : 'NO ENCONTRADO'} en template`);
    }
  }
  
  // 3. Verificar si 'construccion' está en features
  const hasConstructionFeature = company.features && company.features.includes('construccion');
  console.log(`\n${hasConstructionFeature ? '✅' : '❌'} Feature 'construccion' ${hasConstructionFeature ? 'ENCONTRADA' : 'NO ENCONTRADA'} en company.features`);
  
  // 4. Verificar features del template
  if (company.client_templates && company.client_templates.available_features) {
    const hasConstructionInTemplate = company.client_templates.available_features.includes('construccion');
    console.log(`${hasConstructionInTemplate ? '✅' : '❌'} Feature 'construccion' ${hasConstructionInTemplate ? 'ENCONTRADA' : 'NO ENCONTRADA'} en template.available_features`);
  }
  
  // 5. Proponer solución
  console.log('\n🔧 SOLUCIÓN:');
  if (!hasConstructionFeature) {
    console.log('1. Agregar "construccion" al array features de la empresa Inted');
    
    // Agregar construccion a features
    const currentFeatures = company.features || [];
    const newFeatures = [...currentFeatures];
    if (!newFeatures.includes('construccion')) {
      newFeatures.push('construccion');
    }
    
    const { error: updateError } = await supabase
      .from('companies')
      .update({ features: newFeatures })
      .eq('id', company.id);
      
    if (updateError) {
      console.log('❌ Error actualizando features:', updateError.message);
    } else {
      console.log('✅ Feature "construccion" agregada a Inted');
      console.log('\n🚀 Ahora puedes acceder al módulo construcción en:');
      console.log(`http://localhost:3000/workspace/construccion?company_id=${company.id}`);
    }
  } else {
    console.log('✅ La empresa ya tiene el feature "construccion" habilitado');
    console.log('\n🚀 Puedes acceder al módulo construcción en:');
    console.log(`http://localhost:3000/workspace/construccion?company_id=${company.id}`);
  }
}

checkIntedTemplate().catch(console.error);