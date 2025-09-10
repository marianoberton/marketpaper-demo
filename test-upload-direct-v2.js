/**
 * Script de prueba directa para el sistema de upload usando Supabase directamente
 * Evita los endpoints de Next.js y usa el cliente de Supabase con service role
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

// IDs de prueba
const TEST_COMPANY_ID = '57bffb9f-78ba-4252-a9ea-10adf83c3155'; // Inted

async function testDirectUploadFlow() {
  console.log('🚀 Iniciando prueba de upload directo con Supabase...');
  
  try {
    // 1. Verificar proyectos disponibles
    console.log('\n1️⃣ Verificando proyectos disponibles...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', TEST_COMPANY_ID);
    
    if (projectsError) {
      console.error('❌ Error al consultar proyectos:', projectsError.message);
      return;
    }
    
    console.log('📋 Proyectos encontrados:', projects.length);
    projects.forEach(proj => {
      console.log(`   - ${proj.name} (${proj.id})`);
    });
    
    if (projects.length === 0) {
      console.error('❌ No hay proyectos disponibles para la company');
      return;
    }
    
    // Usar el primer proyecto disponible
    const project = projects[0];
    const TEST_PROJECT_ID_ACTUAL = project.id;
    console.log('✅ Usando proyecto:', project.name, `(${TEST_PROJECT_ID_ACTUAL})`);
    
    // 2. Crear archivo de prueba temporal
    console.log('\n2️⃣ Creando archivo de prueba...');
    const testFileName = `test-document-${Date.now()}.txt`;
    const testFileContent = `Documento de prueba\nFecha: ${new Date().toISOString()}\nProyecto: ${project.name}\nCompany: ${TEST_COMPANY_ID}`;
    const testFilePath = path.join(__dirname, testFileName);
    
    fs.writeFileSync(testFilePath, testFileContent);
    console.log('✅ Archivo creado:', testFilePath);
    
    // 3. Generar signed URL directamente con Supabase
    console.log('\n3️⃣ Generando signed URL...');
    const storagePath = `${TEST_COMPANY_ID}/projects/${TEST_PROJECT_ID_ACTUAL}/planos/${testFileName}`;
    
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('construction-documents')
      .createSignedUploadUrl(storagePath, {
        upsert: false // No sobrescribir archivos existentes
      });
    
    if (signedUrlError) {
      console.error('❌ Error al generar signed URL:', signedUrlError.message);
      return;
    }
    
    console.log('✅ Signed URL generada');
    console.log('📝 Path:', signedUrlData.path);
    console.log('📝 Token:', signedUrlData.token?.substring(0, 20) + '...');
    
    // 4. Subir archivo usando signed URL
    console.log('\n4️⃣ Subiendo archivo...');
    const fileBuffer = fs.readFileSync(testFilePath);
    
    const uploadResponse = await fetch(signedUrlData.signedUrl, {
      method: 'PUT',
      body: fileBuffer,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
    
    if (!uploadResponse.ok) {
      console.error('❌ Error al subir archivo:', uploadResponse.status, await uploadResponse.text());
      return;
    }
    
    console.log('✅ Archivo subido exitosamente');
    
    // 5. Crear registro en project_documents
    console.log('\n5️⃣ Creando registro en base de datos...');
    const { data: documentRecord, error: documentError } = await supabase
      .from('project_documents')
      .insert({
        project_id: TEST_PROJECT_ID_ACTUAL,
        filename: testFileName,
        original_filename: testFileName,
        file_url: storagePath,
        file_size: fileBuffer.length,
        mime_type: 'text/plain',
        section_name: 'planos',
        uploaded_by: 'test-script'
      })
      .select()
      .single();
    
    if (documentError) {
      console.error('❌ Error al crear registro en DB:', documentError.message);
      return;
    }
    
    console.log('✅ Registro creado en DB:', documentRecord.id);
    
    // 6. Verificar que el archivo está en el bucket
    console.log('\n6️⃣ Verificando archivo en storage...');
    const { data: files, error: listError } = await supabase.storage
      .from('construction-documents')
      .list(`${TEST_COMPANY_ID}/projects/${TEST_PROJECT_ID_ACTUAL}/planos`);
    
    if (listError) {
      console.error('❌ Error al listar archivos:', listError.message);
      return;
    }
    
    const uploadedFile = files.find(f => f.name === testFileName);
    if (uploadedFile) {
      console.log('✅ Archivo encontrado en storage:', uploadedFile.name, `(${uploadedFile.metadata?.size} bytes)`);
    } else {
      console.error('❌ Archivo no encontrado en storage');
    }
    
    // 7. Probar descarga con signed URL
    console.log('\n7️⃣ Probando descarga...');
    const { data: downloadUrl, error: downloadError } = await supabase.storage
      .from('construction-documents')
      .createSignedUrl(storagePath, 60); // 60 segundos
    
    if (downloadError) {
      console.error('❌ Error al generar URL de descarga:', downloadError.message);
    } else {
      console.log('✅ URL de descarga generada:', downloadUrl.signedUrl.substring(0, 50) + '...');
      
      // Probar descarga
      const downloadResponse = await fetch(downloadUrl.signedUrl);
      if (downloadResponse.ok) {
        const downloadedContent = await downloadResponse.text();
        console.log('✅ Contenido descargado:', downloadedContent.substring(0, 50) + '...');
      } else {
        console.error('❌ Error al descargar:', downloadResponse.status);
      }
    }
    
    // 8. Limpiar archivo temporal
    fs.unlinkSync(testFilePath);
    console.log('\n🧹 Archivo temporal eliminado');
    
    console.log('\n🎉 ¡Prueba de upload completada exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - Company ID: ${TEST_COMPANY_ID}`);
    console.log(`   - Project ID: ${TEST_PROJECT_ID_ACTUAL}`);
    console.log(`   - Archivo: ${testFileName}`);
    console.log(`   - Ruta en storage: ${storagePath}`);
    console.log(`   - Registro DB: ${documentRecord.id}`);
    console.log(`   - Tamaño: ${fileBuffer.length} bytes`);
    
  } catch (error) {
    console.error('💥 Error durante la prueba:', error.message);
    console.error(error.stack);
  }
}

// Ejecutar la prueba
testDirectUploadFlow().then(() => {
  console.log('\n✨ Script finalizado');
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});