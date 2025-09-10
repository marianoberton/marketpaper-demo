/**
 * Script para probar el aislamiento entre companies DESPUÉS de aplicar RLS
 * Ejecutar DESPUÉS de aplicar fix-storage-rls-security.sql en Supabase
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// IDs de companies para prueba
const COMPANY_A_ID = '57bffb9f-78ba-4252-a9ea-10adf83c3155'; // Inted
const COMPANY_B_ID = '7bdeb018-fe41-49c8-b429-9ec60684ab73'; // Yo S.A

async function testIsolationAfterRLS() {
  console.log('🔒 Probando aislamiento DESPUÉS de aplicar RLS...');
  
  try {
    // 1. Verificar políticas actuales
    console.log('\n1️⃣ Verificando políticas de seguridad aplicadas...');
    
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_storage_policies'); // Esta función puede no existir, es solo para verificar
    
    if (policiesError) {
      console.log('ℹ️ No se puede verificar políticas automáticamente (normal)');
    }
    
    // 2. Obtener proyectos de cada company
    console.log('\n2️⃣ Obteniendo proyectos por company...');
    
    const { data: projectsA, error: projectsAError } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', COMPANY_A_ID)
      .limit(1);
    
    const { data: projectsB, error: projectsBError } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', COMPANY_B_ID)
      .limit(1);
    
    if (projectsAError || projectsBError) {
      console.error('❌ Error al consultar proyectos:', projectsAError?.message || projectsBError?.message);
      return;
    }
    
    if (projectsA.length === 0 || projectsB.length === 0) {
      console.error('❌ Se necesitan proyectos en ambas companies');
      return;
    }
    
    const projectA = projectsA[0];
    const projectB = projectsB[0];
    
    console.log(`📋 Company A: ${projectA.name} (${projectA.id})`);
    console.log(`📋 Company B: ${projectB.name} (${projectB.id})`);
    
    // 3. Crear archivo de prueba para Company A
    console.log('\n3️⃣ Creando archivo de prueba para Company A...');
    const testFileName = `rls-test-${Date.now()}.txt`;
    const testFileContent = `Archivo RLS test de Company A\nFecha: ${new Date().toISOString()}`;
    const testFilePath = path.join(__dirname, testFileName);
    
    fs.writeFileSync(testFilePath, testFileContent);
    
    const storagePathA = `${COMPANY_A_ID}/projects/${projectA.id}/planos/${testFileName}`;
    
    // 4. Subir archivo usando service role (debería funcionar)
    console.log('\n4️⃣ Subiendo archivo con service role...');
    
    const { data: signedUrlA, error: signedUrlAError } = await supabase.storage
      .from('construction-documents')
      .createSignedUploadUrl(storagePathA, { upsert: false });
    
    if (signedUrlAError) {
      console.error('❌ Error al generar signed URL A:', signedUrlAError.message);
      return;
    }
    
    const fileBuffer = fs.readFileSync(testFilePath);
    const uploadResponseA = await fetch(signedUrlA.signedUrl, {
      method: 'PUT',
      body: fileBuffer,
      headers: { 'Content-Type': 'text/plain' }
    });
    
    if (!uploadResponseA.ok) {
      console.error('❌ Error al subir archivo A:', uploadResponseA.status);
      return;
    }
    
    console.log('✅ Archivo subido a Company A:', storagePathA);
    
    // 5. Crear cliente con usuario simulado de Company B
    console.log('\n5️⃣ Simulando acceso desde Company B...');
    
    // Nota: Con service role, RLS se bypassa. Para prueba real necesitamos usuarios reales.
    console.log('⚠️ NOTA: Service role bypassa RLS. Para prueba completa necesitas usuarios reales.');
    
    // 6. Intentar acceder al archivo de Company A
    console.log('\n6️⃣ Probando acceso cruzado con service role...');
    
    // Listar archivos de Company A
    const { data: filesA, error: listAError } = await supabase.storage
      .from('construction-documents')
      .list(`${COMPANY_A_ID}/projects/${projectA.id}/planos`);
    
    if (listAError) {
      console.log('✅ CORRECTO: No se puede listar archivos de Company A:', listAError.message);
    } else {
      console.log('⚠️ Service role puede listar (esperado):', filesA.length, 'archivos');
    }
    
    // Intentar descargar archivo de Company A
    const { data: downloadUrlA, error: downloadAError } = await supabase.storage
      .from('construction-documents')
      .createSignedUrl(storagePathA, 60);
    
    if (downloadAError) {
      console.log('✅ CORRECTO: No se puede generar URL de descarga:', downloadAError.message);
    } else {
      console.log('⚠️ Service role puede generar URL (esperado)');
      
      // Probar descarga
      const downloadResponse = await fetch(downloadUrlA.signedUrl);
      if (downloadResponse.ok) {
        console.log('⚠️ Service role puede descargar (esperado)');
      } else {
        console.log('✅ CORRECTO: La descarga falla con status:', downloadResponse.status);
      }
    }
    
    // 7. Verificar estructura de paths
    console.log('\n7️⃣ Verificando estructura de paths...');
    
    const pathParts = storagePathA.split('/');
    console.log('📁 Estructura del path:', {
      company_id: pathParts[0],
      folder: pathParts[1],
      project_id: pathParts[2],
      section: pathParts[3],
      filename: pathParts[4]
    });
    
    // 8. Limpiar archivos de prueba
    console.log('\n8️⃣ Limpiando archivos de prueba...');
    
    // Eliminar archivo del storage
    const { error: deleteError } = await supabase.storage
      .from('construction-documents')
      .remove([storagePathA]);
    
    if (deleteError) {
      console.log('⚠️ Error al eliminar archivo del storage:', deleteError.message);
    } else {
      console.log('✅ Archivo eliminado del storage');
    }
    
    // Eliminar archivo temporal
    fs.unlinkSync(testFilePath);
    console.log('✅ Archivo temporal eliminado');
    
    console.log('\n📊 Resumen de la prueba POST-RLS:');
    console.log('   ✅ Archivo subido correctamente');
    console.log('   ⚠️ Service role bypassa RLS (comportamiento esperado)');
    console.log('   📝 Para prueba completa: usar usuarios reales con JWT');
    console.log('   🔧 Próximo paso: Probar con usuarios autenticados reales');
    
  } catch (error) {
    console.error('💥 Error durante la prueba:', error.message);
    console.error(error.stack);
  }
}

// Ejecutar la prueba
testIsolationAfterRLS().then(() => {
  console.log('\n✨ Prueba POST-RLS finalizada');
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});