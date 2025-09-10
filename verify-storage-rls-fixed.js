// Script para verificar que las políticas RLS de storage funcionan correctamente
// Ejecutar DESPUÉS de aplicar fix-storage-rls-security.sql

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Usuarios de prueba (deben existir)
const USER_A_EMAIL = 'guillerminaberton@gmail.com'; // Company A
const USER_B_EMAIL = 'fs@inted.com.ar'; // Company B
const TEST_PASSWORD = 'TestPassword123!';

async function main() {
  console.log('🔒 Verificando que RLS de Storage funciona correctamente...');
  
  try {
    // 1. Verificar políticas en base de datos
    console.log('\n1️⃣ Verificando políticas de seguridad...');
    await checkSecurityPolicies();
    
    // 2. Probar acceso con usuarios autenticados
    console.log('\n2️⃣ Probando acceso con usuarios autenticados...');
    await testAuthenticatedAccess();
    
    // 3. Probar acceso anónimo (debe fallar)
    console.log('\n3️⃣ Probando acceso anónimo (debe fallar)...');
    await testAnonymousAccess();
    
    // 4. Probar acceso cruzado entre companies (debe fallar)
    console.log('\n4️⃣ Probando acceso cruzado entre companies (debe fallar)...');
    await testCrossCompanyAccess();
    
    console.log('\n✅ Verificación de RLS completada');
    
  } catch (error) {
    console.error('❌ Error en verificación:', error.message);
    process.exit(1);
  }
}

async function checkSecurityPolicies() {
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Verificar que no hay políticas públicas
  const { data: policies, error } = await serviceClient
    .from('pg_policies')
    .select('policyname, roles, cmd')
    .eq('schemaname', 'storage')
    .eq('tablename', 'objects');
    
  if (error) {
    throw new Error(`Error consultando políticas: ${error.message}`);
  }
  
  const publicPolicies = policies.filter(p => p.roles.includes('public'));
  const authenticatedPolicies = policies.filter(p => p.roles.includes('authenticated'));
  
  console.log(`   📊 Políticas públicas: ${publicPolicies.length}`);
  console.log(`   📊 Políticas autenticadas: ${authenticatedPolicies.length}`);
  console.log(`   📊 Total políticas: ${policies.length}`);
  
  if (publicPolicies.length > 0) {
    console.log('   🚨 CRÍTICO: Se encontraron políticas públicas:');
    publicPolicies.forEach(p => {
      console.log(`      - ${p.policyname} (${p.cmd})`);
    });
    throw new Error('Políticas públicas encontradas - RLS no seguro');
  }
  
  console.log('   ✅ No se encontraron políticas públicas');
  
  if (authenticatedPolicies.length === 0) {
    console.log('   ⚠️ No se encontraron políticas para usuarios autenticados');
  }
}

async function testAuthenticatedAccess() {
  // Probar con Usuario A
  const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const { data: authA, error: authErrorA } = await clientA.auth.signInWithPassword({
    email: USER_A_EMAIL,
    password: TEST_PASSWORD
  });
  
  if (authErrorA) {
    throw new Error(`Error autenticando Usuario A: ${authErrorA.message}`);
  }
  
  console.log(`   ✅ Usuario A autenticado: ${USER_A_EMAIL}`);
  
  // Intentar listar archivos de su propia company
  const { data: filesA, error: listErrorA } = await clientA.storage
    .from('construction-documents')
    .list('', { limit: 10 });
    
  if (listErrorA) {
    console.log(`   ⚠️ Usuario A no puede listar archivos: ${listErrorA.message}`);
  } else {
    console.log(`   ✅ Usuario A puede listar archivos de su company`);
  }
  
  // Intentar generar signed URL
  const testPath = '14d2c0ed-f148-4abb-a82e-d19fba9526a8/projects/test/test.txt';
  const { data: signedUrlA, error: urlErrorA } = await clientA.storage
    .from('construction-documents')
    .createSignedUrl(testPath, 60);
    
  if (urlErrorA) {
    console.log(`   ⚠️ Usuario A no puede generar signed URL: ${urlErrorA.message}`);
  } else {
    console.log(`   ✅ Usuario A puede generar signed URLs`);
  }
  
  await clientA.auth.signOut();
}

async function testAnonymousAccess() {
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Intentar listar archivos sin autenticación
  const { data: files, error: listError } = await anonClient.storage
    .from('construction-documents')
    .list('', { limit: 10 });
    
  if (listError) {
    console.log(`   ✅ Acceso anónimo bloqueado correctamente: ${listError.message}`);
  } else {
    console.log(`   🚨 CRÍTICO: Usuario anónimo puede listar archivos`);
    throw new Error('RLS no está bloqueando acceso anónimo');
  }
  
  // Intentar generar signed URL sin autenticación
  const testPath = '14d2c0ed-f148-4abb-a82e-d19fba9526a8/projects/test/test.txt';
  const { data: signedUrl, error: urlError } = await anonClient.storage
    .from('construction-documents')
    .createSignedUrl(testPath, 60);
    
  if (urlError) {
    console.log(`   ✅ Signed URL anónima bloqueada correctamente: ${urlError.message}`);
  } else {
    console.log(`   🚨 CRÍTICO: Usuario anónimo puede generar signed URLs`);
    throw new Error('RLS no está bloqueando signed URLs anónimas');
  }
}

async function testCrossCompanyAccess() {
  // Autenticar Usuario B
  const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const { data: authB, error: authErrorB } = await clientB.auth.signInWithPassword({
    email: USER_B_EMAIL,
    password: TEST_PASSWORD
  });
  
  if (authErrorB) {
    throw new Error(`Error autenticando Usuario B: ${authErrorB.message}`);
  }
  
  console.log(`   ✅ Usuario B autenticado: ${USER_B_EMAIL}`);
  
  // Intentar acceder a archivos de Company A
  const companyAPath = '14d2c0ed-f148-4abb-a82e-d19fba9526a8';
  const { data: filesB, error: listErrorB } = await clientB.storage
    .from('construction-documents')
    .list(companyAPath, { limit: 10 });
    
  if (listErrorB) {
    console.log(`   ✅ Acceso cruzado bloqueado correctamente: ${listErrorB.message}`);
  } else {
    console.log(`   🚨 CRÍTICO: Usuario B puede listar archivos de Company A`);
    console.log(`   📁 Archivos encontrados: ${filesB.length}`);
    throw new Error('RLS no está bloqueando acceso cruzado entre companies');
  }
  
  // Intentar generar signed URL para archivo de Company A
  const testPath = '14d2c0ed-f148-4abb-a82e-d19fba9526a8/projects/test/test.txt';
  const { data: signedUrlB, error: urlErrorB } = await clientB.storage
    .from('construction-documents')
    .createSignedUrl(testPath, 60);
    
  if (urlErrorB) {
    console.log(`   ✅ Signed URL cruzada bloqueada correctamente: ${urlErrorB.message}`);
  } else {
    console.log(`   🚨 CRÍTICO: Usuario B puede generar signed URL de Company A`);
    throw new Error('RLS no está bloqueando signed URLs cruzadas');
  }
  
  await clientB.auth.signOut();
}

if (require.main === module) {
  main();
}

module.exports = { main };