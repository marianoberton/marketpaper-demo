/**
 * Script para probar aislamiento entre companies con usuarios REALES autenticados
 * Esto prueba RLS de manera efectiva (no service role)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Faltan claves de Supabase');
  process.exit(1);
}

// Cliente con service role para setup
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Cliente público para usuarios autenticados
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// IDs de companies para prueba (usuarios reales existentes)
const COMPANY_A_ID = '14d2c0ed-f148-4abb-a82e-d19fba9526a8'; // Fomo
const COMPANY_B_ID = '57bffb9f-78ba-4252-a9ea-10adf83c3155'; // Inted

// Credenciales de usuarios de prueba (usuarios reales existentes)
const USER_A_EMAIL = 'guillerminaberton@gmail.com'; // Usuario de Fomo
const USER_B_EMAIL = 'fs@inted.com.ar'; // Usuario de Inted
const TEST_PASSWORD = 'TestPassword123!'; // Password configurado para pruebas

// Función removida - ahora usamos usuarios existentes

async function authenticateUser(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    console.error(`❌ Error al autenticar ${email}:`, error.message);
    return null;
  }
  
  console.log(`✅ Usuario autenticado: ${email}`);
  return data.user;
}

async function testIsolationWithRealUsers() {
  console.log('🔒 Probando aislamiento con usuarios REALES autenticados...');
  
  try {
    // 1. Verificar que existen usuarios en ambas companies
    console.log('\n1️⃣ Verificando usuarios de prueba...');
    
    const { data: userA, error: userAError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('email', USER_A_EMAIL)
      .eq('company_id', COMPANY_A_ID)
      .single();
    
    if (userAError) {
      console.error('❌ Usuario A no encontrado:', userAError.message);
      return;
    }
    
    const { data: userB, error: userBError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('email', USER_B_EMAIL)
      .eq('company_id', COMPANY_B_ID)
      .single();
    
    if (userBError) {
      console.error('❌ Usuario B no encontrado:', userBError.message);
      return;
    }
    
    console.log(`👤 Usuario A: ${userA.email} (Company: ${userA.company_id})`);
    console.log(`👤 Usuario B: ${userB.email} (Company: ${userB.company_id})`);
    
    // 2. Obtener proyectos
    console.log('\n2️⃣ Obteniendo proyectos...');
    
    const { data: projectsA } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('company_id', COMPANY_A_ID)
      .limit(1);
    
    const { data: projectsB } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('company_id', COMPANY_B_ID)
      .limit(1);
    
    if (!projectsA?.length || !projectsB?.length) {
      console.error('❌ Se necesitan proyectos en ambas companies');
      return;
    }
    
    const projectA = projectsA[0];
    const projectB = projectsB[0];
    
    // 3. Autenticar Usuario A y subir archivo
    console.log('\n3️⃣ Autenticando Usuario A y subiendo archivo...');
    
    const authUserA = await authenticateUser(USER_A_EMAIL, TEST_PASSWORD);
    if (!authUserA) {
      console.log('⚠️ No se pudo autenticar Usuario A');
      console.log('💡 Tip: Verifica que el password sea correcto');
      return;
    }
    
    // Crear archivo de prueba
    const testFileName = `isolation-real-users-${Date.now()}.txt`;
    const testFileContent = `Archivo de Company A - Usuario Real\nFecha: ${new Date().toISOString()}`;
    const testFilePath = path.join(__dirname, testFileName);
    
    fs.writeFileSync(testFilePath, testFileContent);
    
    const storagePathA = `${COMPANY_A_ID}/projects/${projectA.id}/planos/${testFileName}`;
    
    // Subir archivo como Usuario A
    const { data: signedUrlA, error: signedUrlAError } = await supabaseClient.storage
      .from('construction-documents')
      .createSignedUploadUrl(storagePathA, { upsert: false });
    
    if (signedUrlAError) {
      console.error('❌ Usuario A no puede generar signed URL:', signedUrlAError.message);
      console.log('🔍 Esto puede indicar que RLS está funcionando correctamente');
    } else {
      console.log('✅ Usuario A puede generar signed URL');
      
      const fileBuffer = fs.readFileSync(testFilePath);
      const uploadResponseA = await fetch(signedUrlA.signedUrl, {
        method: 'PUT',
        body: fileBuffer,
        headers: { 'Content-Type': 'text/plain' }
      });
      
      if (uploadResponseA.ok) {
        console.log('✅ Usuario A subió archivo exitosamente');
      } else {
        console.error('❌ Usuario A falló al subir:', uploadResponseA.status);
      }
    }
    
    // 4. Cerrar sesión y autenticar Usuario B
    console.log('\n4️⃣ Cambiando a Usuario B...');
    
    await supabaseClient.auth.signOut();
    
    const authUserB = await authenticateUser(USER_B_EMAIL, TEST_PASSWORD);
    if (!authUserB) {
      console.error('❌ No se pudo autenticar Usuario B');
      return;
    }
    
    // 5. Usuario B intenta acceder al archivo de Company A
    console.log('\n5️⃣ Usuario B intenta acceder a archivo de Company A...');
    
    // Intentar listar archivos de Company A
    const { data: filesA, error: listAError } = await supabaseClient.storage
      .from('construction-documents')
      .list(`${COMPANY_A_ID}/projects/${projectA.id}/planos`);
    
    if (listAError) {
      console.log('✅ CORRECTO: Usuario B no puede listar archivos de Company A');
      console.log('   Error:', listAError.message);
    } else {
      console.log('🚨 PROBLEMA: Usuario B puede listar archivos de Company A');
      console.log('   Archivos encontrados:', filesA.length);
    }
    
    // Intentar generar URL de descarga
    const { data: downloadUrlA, error: downloadAError } = await supabaseClient.storage
      .from('construction-documents')
      .createSignedUrl(storagePathA, 60);
    
    if (downloadAError) {
      console.log('✅ CORRECTO: Usuario B no puede generar URL de descarga');
      console.log('   Error:', downloadAError.message);
    } else {
      console.log('🚨 PROBLEMA: Usuario B puede generar URL de descarga');
      
      // Probar descarga
      const downloadResponse = await fetch(downloadUrlA.signedUrl);
      if (downloadResponse.ok) {
        console.log('🚨 CRÍTICO: Usuario B puede descargar archivo de Company A');
      } else {
        console.log('✅ CORRECTO: La descarga falla con status:', downloadResponse.status);
      }
    }
    
    // 6. Usuario B intenta subir a Company A
    console.log('\n6️⃣ Usuario B intenta subir archivo a Company A...');
    
    const maliciousPath = `${COMPANY_A_ID}/projects/${projectA.id}/planos/malicious-${Date.now()}.txt`;
    
    const { data: maliciousUrl, error: maliciousError } = await supabaseClient.storage
      .from('construction-documents')
      .createSignedUploadUrl(maliciousPath, { upsert: false });
    
    if (maliciousError) {
      console.log('✅ CORRECTO: Usuario B no puede subir a Company A');
      console.log('   Error:', maliciousError.message);
    } else {
      console.log('🚨 CRÍTICO: Usuario B puede generar URL de subida a Company A');
    }
    
    // 7. Limpiar
    console.log('\n7️⃣ Limpiando archivos de prueba...');
    
    await supabaseClient.auth.signOut();
    
    // Limpiar con admin
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('✅ Archivo temporal eliminado');
    }
    
    // Intentar eliminar del storage con admin
    const { error: deleteError } = await supabaseAdmin.storage
      .from('construction-documents')
      .remove([storagePathA]);
    
    if (!deleteError) {
      console.log('✅ Archivo eliminado del storage');
    }
    
    console.log('\n📊 Resumen de la prueba con usuarios reales:');
    console.log('   🔍 Esta prueba verifica RLS de manera efectiva');
    console.log('   ✅ Los errores de acceso son CORRECTOS (indican seguridad)');
    console.log('   🚨 Los accesos exitosos son PROBLEMAS de seguridad');
    
  } catch (error) {
    console.error('💥 Error durante la prueba:', error.message);
    console.error(error.stack);
  }
}

// Ejecutar la prueba
testIsolationWithRealUsers().then(() => {
  console.log('\n✨ Prueba con usuarios reales finalizada');
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});