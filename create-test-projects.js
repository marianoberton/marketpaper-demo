/**
 * Script para crear proyectos de prueba en ambas companies
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Cargar variables de entorno desde .env
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

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Falta SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// IDs de companies
const COMPANY_A_ID = '14d2c0ed-f148-4abb-a82e-d19fba9526a8'; // Fomo
const COMPANY_B_ID = '57bffb9f-78ba-4252-a9ea-10adf83c3155'; // Inted

async function createTestProjects() {
  console.log('🏗️ Creando proyectos de prueba...');
  
  try {
    // 1. Verificar proyectos existentes
    console.log('\n1️⃣ Verificando proyectos existentes...');
    
    const { data: projectsA, error: projectsAError } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', COMPANY_A_ID);
    
    const { data: projectsB, error: projectsBError } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', COMPANY_B_ID);
    
    console.log(`📊 Fomo tiene ${projectsA?.length || 0} proyectos`);
    console.log(`📊 Inted tiene ${projectsB?.length || 0} proyectos`);
    
    // 2. Crear proyecto para Fomo si no existe
    if (!projectsA || projectsA.length === 0) {
      console.log('\n2️⃣ Creando proyecto para Fomo...');
      
      const { data: newProjectA, error: createAError } = await supabase
        .from('projects')
        .insert({
          company_id: COMPANY_A_ID,
          name: 'Proyecto Test Fomo',
          address: 'Dirección Test Fomo 123',
          surface: 100.5,
          status: 'active'
        })
        .select()
        .single();
      
      if (createAError) {
        console.error('❌ Error creando proyecto Fomo:', createAError.message);
      } else {
        console.log('✅ Proyecto Fomo creado:', newProjectA.name);
      }
    } else {
      console.log('✅ Fomo ya tiene proyectos');
    }
    
    // 3. Crear proyecto para Inted si no existe
    if (!projectsB || projectsB.length === 0) {
      console.log('\n3️⃣ Creando proyecto para Inted...');
      
      const { data: newProjectB, error: createBError } = await supabase
        .from('projects')
        .insert({
          company_id: COMPANY_B_ID,
          name: 'Proyecto Test Inted',
          address: 'Dirección Test Inted 456',
          surface: 200.75,
          status: 'active'
        })
        .select()
        .single();
      
      if (createBError) {
        console.error('❌ Error creando proyecto Inted:', createBError.message);
      } else {
        console.log('✅ Proyecto Inted creado:', newProjectB.name);
      }
    } else {
      console.log('✅ Inted ya tiene proyectos');
    }
    
    // 4. Verificar resultado final
    console.log('\n4️⃣ Verificación final...');
    
    const { data: finalProjectsA } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', COMPANY_A_ID);
    
    const { data: finalProjectsB } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', COMPANY_B_ID);
    
    console.log(`✅ Fomo: ${finalProjectsA?.length || 0} proyectos`);
    if (finalProjectsA?.length > 0) {
      finalProjectsA.forEach(p => {
        console.log(`   - ${p.name} (ID: ${p.id})`);
      });
    }
    
    console.log(`✅ Inted: ${finalProjectsB?.length || 0} proyectos`);
    if (finalProjectsB?.length > 0) {
      finalProjectsB.forEach(p => {
        console.log(`   - ${p.name} (ID: ${p.id})`);
      });
    }
    
    if (finalProjectsA?.length > 0 && finalProjectsB?.length > 0) {
      console.log('\n🎉 ¡Listo para pruebas de aislamiento!');
    } else {
      console.log('\n⚠️ Aún faltan proyectos para las pruebas');
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Ejecutar creación
createTestProjects().then(() => {
  console.log('\n✨ Creación de proyectos completada');
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});