/**
 * Script para probar el aislamiento entre companies en el sistema de storage
 * Verifica que una company no puede acceder a archivos de otra company
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

async function testCompanyIsolation() {
  console.log('🔒 Iniciando prueba de aislamiento entre companies...');
  
  try {
    // 1. Verificar companies disponibles
    console.log('\n1️⃣ Verificando companies disponibles...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*');
    
    if (companiesError) {
      console.error('❌ Error al consultar companies:', companiesError.message);
      return;
    }
    
    console.log('📋 Companies encontradas:', companies.length);
    companies.forEach(company => {
      console.log(`   - ${company.name} (${company.id})`);
    });
    
    if (companies.length < 2) {
      console.log('⚠️ Se necesitan al menos 2 companies para probar aislamiento');
      return;
    }
    
    // 2. Obtener proyectos de cada company
    console.log('\n2️⃣ Obteniendo proyectos por company...');
    
    const { data: projectsA, error: projectsAError } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', COMPANY_A_ID);
    
    const { data: projectsB, error: projectsBError } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', COMPANY_B_ID);
    
    if (projectsAError || projectsBError) {
      console.error('❌ Error al consultar proyectos:', projectsAError?.message || projectsBError?.message);
      return;
    }
    
    console.log(`📋 Company A (${COMPANY_A_ID}): ${projectsA.length} proyectos`);
    console.log(`📋 Company B (${COMPANY_B_ID}): ${projectsB.length} proyectos`);
    
    if (projectsA.length === 0) {
      console.error('❌ Company A no tiene proyectos');
      return;
    }
    
    // Si Company B no tiene proyectos, crear uno
    let projectB;
    if (projectsB.length === 0) {
      console.log('🔧 Creando proyecto para Company B...');
      const { data: newProject, error: createProjectError } = await supabase
        .from('projects')
        .insert({
          company_id: COMPANY_B_ID,
          name: 'Proyecto Test Company B',
          address: 'Dirección de prueba',
          status: 'active'
        })
        .select()
        .single();
      
      if (createProjectError) {
        console.error('❌ Error al crear proyecto B:', createProjectError.message);
        return;
      }
      
      projectB = newProject;
      console.log('✅ Proyecto B creado:', projectB.name);
    } else {
      projectB = projectsB[0];
    }
    
    const projectA = projectsA[0];
    
    // 3. Subir archivo a Company A
    console.log('\n3️⃣ Subiendo archivo a Company A...');
    const testFileName = `isolation-test-${Date.now()}.txt`;
    const testFileContent = `Archivo de Company A\nFecha: ${new Date().toISOString()}`;
    const testFilePath = path.join(__dirname, testFileName);
    
    fs.writeFileSync(testFilePath, testFileContent);
    
    const storagePathA = `${COMPANY_A_ID}/projects/${projectA.id}/planos/${testFileName}`;
    
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
    
    // 4. Intentar acceder al archivo de Company A desde Company B
    console.log('\n4️⃣ Probando acceso cruzado (Company B → archivo de Company A)...');
    
    // Intentar listar archivos de Company A usando path de Company B
    const { data: filesB, error: listBError } = await supabase.storage
      .from('construction-documents')
      .list(`${COMPANY_A_ID}/projects/${projectA.id}/planos`);
    
    if (listBError) {
      console.log('✅ CORRECTO: No se puede listar archivos de Company A:', listBError.message);
    } else {
      console.log('⚠️ PROBLEMA: Se pueden listar archivos de Company A desde cualquier contexto');
      console.log('   Archivos encontrados:', filesB.length);
    }
    
    // Intentar descargar directamente el archivo de Company A
    const { data: downloadUrlA, error: downloadAError } = await supabase.storage
      .from('construction-documents')
      .createSignedUrl(storagePathA, 60);
    
    if (downloadAError) {
      console.log('✅ CORRECTO: No se puede generar URL de descarga para archivo de Company A:', downloadAError.message);
    } else {
      console.log('⚠️ PROBLEMA: Se puede generar URL de descarga para archivo de Company A');
      
      // Probar descarga
      const downloadResponse = await fetch(downloadUrlA.signedUrl);
      if (downloadResponse.ok) {
        console.log('🚨 CRÍTICO: Se puede descargar archivo de Company A desde cualquier contexto');
      } else {
        console.log('✅ CORRECTO: La descarga falla con status:', downloadResponse.status);
      }
    }
    
    // 5. Probar RLS en project_documents
    console.log('\n5️⃣ Probando RLS en project_documents...');
    
    // Crear registro en project_documents para Company A
    const { data: docRecordA, error: docAError } = await supabase
      .from('project_documents')
      .insert({
        project_id: projectA.id,
        filename: testFileName,
        original_filename: testFileName,
        file_url: storagePathA,
        file_size: fileBuffer.length,
        mime_type: 'text/plain',
        section_name: 'planos',
        uploaded_by: 'isolation-test'
      })
      .select()
      .single();
    
    if (docAError) {
      console.error('❌ Error al crear registro A:', docAError.message);
      return;
    }
    
    console.log('✅ Registro creado para Company A:', docRecordA.id);
    
    // Intentar consultar documentos de Company A desde contexto de Company B
    // (Esto requeriría simular un usuario de Company B, por ahora usamos service role)
    const { data: docsA, error: docsAError } = await supabase
      .from('project_documents')
      .select('*')
      .eq('project_id', projectA.id);
    
    if (docsAError) {
      console.log('✅ CORRECTO: RLS bloquea acceso a documentos de Company A:', docsAError.message);
    } else {
      console.log('⚠️ PROBLEMA: Se pueden consultar documentos de Company A (service role bypassa RLS)');
      console.log('   Documentos encontrados:', docsA.length);
    }
    
    // 6. Limpiar archivos de prueba
    console.log('\n6️⃣ Limpiando archivos de prueba...');
    
    // Eliminar archivo del storage
    const { error: deleteError } = await supabase.storage
      .from('construction-documents')
      .remove([storagePathA]);
    
    if (deleteError) {
      console.log('⚠️ Error al eliminar archivo del storage:', deleteError.message);
    } else {
      console.log('✅ Archivo eliminado del storage');
    }
    
    // Eliminar registro de la DB
    const { error: deleteDocError } = await supabase
      .from('project_documents')
      .delete()
      .eq('id', docRecordA.id);
    
    if (deleteDocError) {
      console.log('⚠️ Error al eliminar registro:', deleteDocError.message);
    } else {
      console.log('✅ Registro eliminado de la DB');
    }
    
    // Eliminar archivo temporal
    fs.unlinkSync(testFilePath);
    console.log('✅ Archivo temporal eliminado');
    
    console.log('\n📊 Resumen de la prueba de aislamiento:');
    console.log('   - Storage: Depende de RLS y políticas de Supabase');
    console.log('   - project_documents: RLS habilitado pero service role lo bypassa');
    console.log('   - Recomendación: Probar con usuarios reales (no service role)');
    
  } catch (error) {
    console.error('💥 Error durante la prueba:', error.message);
    console.error(error.stack);
  }
}

// Ejecutar la prueba
testCompanyIsolation().then(() => {
  console.log('\n✨ Prueba de aislamiento finalizada');
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});