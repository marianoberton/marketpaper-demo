/**
 * Script para verificar qué usuarios existen en la base de datos
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

async function checkExistingUsers() {
  console.log('👥 Verificando usuarios existentes...');
  
  try {
    // 1. Verificar usuarios en auth.users
    console.log('\n1️⃣ Usuarios en auth.users:');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error obteniendo usuarios auth:', authError.message);
    } else {
      console.log(`📊 Total usuarios auth: ${authUsers.users.length}`);
      authUsers.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
      });
    }
    
    // 2. Verificar usuarios en user_profiles
    console.log('\n2️⃣ Usuarios en user_profiles:');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('email');
    
    if (profileError) {
      console.error('❌ Error obteniendo profiles:', profileError.message);
    } else {
      console.log(`📊 Total profiles: ${profiles.length}`);
      profiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.email} - Company: ${profile.company_id} - Role: ${profile.role}`);
      });
    }
    
    // 3. Verificar companies
    console.log('\n3️⃣ Companies disponibles:');
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .order('name');
    
    if (companyError) {
      console.error('❌ Error obteniendo companies:', companyError.message);
    } else {
      console.log(`📊 Total companies: ${companies.length}`);
      companies.forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.name} (ID: ${company.id})`);
      });
    }
    
    // 4. Verificar usuarios por company
    console.log('\n4️⃣ Usuarios por company:');
    if (profiles && companies) {
      companies.forEach(company => {
        const companyUsers = profiles.filter(p => p.company_id === company.id);
        console.log(`   📁 ${company.name}: ${companyUsers.length} usuarios`);
        companyUsers.forEach(user => {
          console.log(`      - ${user.email} (${user.role})`);
        });
      });
    }
    
    // 5. Sugerir configuración para pruebas
    console.log('\n5️⃣ Sugerencias para pruebas de aislamiento:');
    
    if (companies && companies.length >= 2 && profiles && profiles.length >= 2) {
      const company1 = companies[0];
      const company2 = companies[1];
      
      const users1 = profiles.filter(p => p.company_id === company1.id);
      const users2 = profiles.filter(p => p.company_id === company2.id);
      
      console.log('\n   📋 Configuración recomendada:');
      console.log(`   COMPANY_A_ID = '${company1.id}'; // ${company1.name}`);
      console.log(`   COMPANY_B_ID = '${company2.id}'; // ${company2.name}`);
      
      if (users1.length > 0) {
        console.log(`   USER_A_EMAIL = '${users1[0].email}'; // ${company1.name}`);
      } else {
        console.log(`   ⚠️ No hay usuarios en ${company1.name}`);
      }
      
      if (users2.length > 0) {
        console.log(`   USER_B_EMAIL = '${users2[0].email}'; // ${company2.name}`);
      } else {
        console.log(`   ⚠️ No hay usuarios en ${company2.name}`);
      }
    } else {
      console.log('   ⚠️ Se necesitan al menos 2 companies y 2 usuarios para pruebas');
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Ejecutar verificación
checkExistingUsers().then(() => {
  console.log('\n✨ Verificación completada');
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});