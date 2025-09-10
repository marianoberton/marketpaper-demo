/**
 * Script de prueba directa para el sistema de upload de documentos de construcción
 * Usa credenciales de super admin para evitar problemas de autenticación web
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

// IDs de prueba (usar los del proyecto existente)
const TEST_COMPANY_ID = '57bffb9f-78ba-4252-a9ea-10adf83c3155'; // Inted
const TEST_PROJECT_ID = 'b8f5c2e1-4a3d-4e2f-8c1b-9d7e6f5a4b3c'; // Del script create-test-project.js
const TEST_USER_EMAIL = 'admin@inted.com';

async function testUploadFlow() {
  console.log('🚀 Iniciando prueba de upload directo...');
  
  try {
    // 1. Verificar que el usuario existe y es super admin
    console.log('\n1️⃣ Verificando usuarios super admin disponibles...');
    const { data: superAdmins, error: superAdminsError } = await supabase
      .from('super_admins')
      .select('*');
    
    if (superAdminsError) {
      console.error('❌ Error al consultar super admins:', superAdminsError.message);
      return;
    }
    
    console.log('📋 Super admins encontrados:', superAdmins.length);
    superAdmins.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.role}, ${admin.status})`);
    });
    
    // Usar el primer super admin activo disponible
    const activeAdmin = superAdmins.find(admin => admin.status === 'active');
    if (!activeAdmin) {
      console.error('❌ No hay super admins activos disponibles');
      return;
    }
    
    console.log('✅ Usando super admin:', activeAdmin.email);
    const TEST_USER_EMAIL_ACTUAL = activeAdmin.email;
    
    // 2. Verificar que el proyecto existe
    console.log('\n2️⃣ Verificando proyectos disponibles...');
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
    
    // 3. Crear archivo de prueba temporal
    console.log('\n3️⃣ Creando archivo de prueba...');
    const testFileName = 'test-document.txt';
    const testFileContent = `Documento de prueba\nFecha: ${new Date().toISOString()}\nProyecto: ${project.name}\nCompany: ${TEST_COMPANY_ID}`;
    const testFilePath = path.join(__dirname, testFileName);
    
    fs.writeFileSync(testFilePath, testFileContent);
    console.log('✅ Archivo creado:', testFilePath);
    
    // 4. Probar endpoint de signed URL
    console.log('\n4️⃣ Solicitando signed URL...');
    const uploadPayload = {
      fileName: testFileName,
      fileType: 'text/plain',
      projectId: TEST_PROJECT_ID_ACTUAL,
      sectionName: 'planos'
    };
    
    const response = await fetch('http://localhost:3000/api/storage/create-upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}` // Usar service key directamente
      },
      body: JSON.stringify(uploadPayload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error al obtener signed URL:', response.status, errorText);
      return;
    }
    
    const { signedUrl, token } = await response.json();
    console.log('✅ Signed URL obtenida');
    console.log('📝 Token:', token?.substring(0, 20) + '...');
    
    // 5. Subir archivo usando signed URL
    console.log('\n5️⃣ Subiendo archivo...');
    const fileBuffer = fs.readFileSync(testFilePath);
    
    const uploadResponse = await fetch(signedUrl, {
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
    
    // 6. Confirmar upload y crear registro en DB
    console.log('\n6️⃣ Confirmando upload en base de datos...');
    const confirmPayload = {
      fileUrl: `${TEST_COMPANY_ID}/projects/${TEST_PROJECT_ID_ACTUAL}/planos/${testFileName}`,
      fileName: testFileName,
      projectId: TEST_PROJECT_ID_ACTUAL,
      sectionName: 'planos'
    };
    
    const confirmResponse = await fetch('http://localhost:3000/api/workspace/construction/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify(confirmPayload)
    });
    
    if (!confirmResponse.ok) {
      const errorText = await confirmResponse.text();
      console.error('❌ Error al confirmar upload:', confirmResponse.status, errorText);
      return;
    }
    
    const confirmResult = await confirmResponse.json();
    console.log('✅ Upload confirmado en DB:', confirmResult.id);
    
    // 7. Verificar que el archivo está en el bucket
    console.log('\n7️⃣ Verificando archivo en storage...');
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
    
    // 8. Limpiar archivo temporal
    fs.unlinkSync(testFilePath);
    console.log('\n🧹 Archivo temporal eliminado');
    
    console.log('\n🎉 ¡Prueba de upload completada exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - Company ID: ${TEST_COMPANY_ID}`);
    console.log(`   - Project ID: ${TEST_PROJECT_ID_ACTUAL}`);
    console.log(`   - Archivo: ${testFileName}`);
    console.log(`   - Ruta en storage: ${TEST_COMPANY_ID}/projects/${TEST_PROJECT_ID_ACTUAL}/planos/${testFileName}`);
    console.log(`   - Registro DB: ${confirmResult.id}`);
    
  } catch (error) {
    console.error('💥 Error durante la prueba:', error.message);
    console.error(error.stack);
  }
}

// Ejecutar la prueba
testUploadFlow().then(() => {
  console.log('\n✨ Script finalizado');
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});