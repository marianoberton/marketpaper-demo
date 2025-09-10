/**
 * Script para configurar passwords para usuarios de prueba
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

// Usuarios de prueba
const TEST_USERS = [
  {
    email: 'guillerminaberton@gmail.com',
    password: 'TestPassword123!',
    company: 'Fomo'
  },
  {
    email: 'fs@inted.com.ar',
    password: 'TestPassword123!',
    company: 'Inted'
  }
];

async function setupUserPasswords() {
  console.log('🔐 Configurando passwords para usuarios de prueba...');
  
  try {
    for (const testUser of TEST_USERS) {
      console.log(`\n🔧 Configurando password para ${testUser.email} (${testUser.company})...`);
      
      // 1. Buscar el usuario en auth.users
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('❌ Error listando usuarios:', listError.message);
        continue;
      }
      
      const authUser = users.users.find(u => u.email === testUser.email);
      
      if (!authUser) {
        console.error(`❌ Usuario ${testUser.email} no encontrado en auth.users`);
        continue;
      }
      
      console.log(`✅ Usuario encontrado: ${authUser.email} (ID: ${authUser.id})`);
      
      // 2. Actualizar password
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        authUser.id,
        {
          password: testUser.password,
          email_confirm: true
        }
      );
      
      if (updateError) {
        console.error(`❌ Error actualizando password para ${testUser.email}:`, updateError.message);
      } else {
        console.log(`✅ Password actualizado para ${testUser.email}`);
      }
      
      // 3. Verificar que el usuario puede autenticarse
      console.log(`🔍 Probando autenticación para ${testUser.email}...`);
      
      const testClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      
      const { data: signInData, error: signInError } = await testClient.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password
      });
      
      if (signInError) {
        console.error(`❌ Error de autenticación para ${testUser.email}:`, signInError.message);
      } else {
        console.log(`✅ Autenticación exitosa para ${testUser.email}`);
        
        // Cerrar sesión
        await testClient.auth.signOut();
      }
    }
    
    console.log('\n📋 Resumen de configuración:');
    console.log('   Email: guillerminaberton@gmail.com');
    console.log('   Password: TestPassword123!');
    console.log('   Company: Fomo');
    console.log('');
    console.log('   Email: fs@inted.com.ar');
    console.log('   Password: TestPassword123!');
    console.log('   Company: Inted');
    console.log('');
    console.log('🎉 ¡Usuarios listos para pruebas de aislamiento!');
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Ejecutar configuración
setupUserPasswords().then(() => {
  console.log('\n✨ Configuración de passwords completada');
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});