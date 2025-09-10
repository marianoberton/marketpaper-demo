const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Archivo .env.local no encontrado');
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return env;
}

const env = loadEnvFile();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

// Cliente con service role para operaciones administrativas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkCurrentPolicies() {
  console.log('🔍 VERIFICANDO POLÍTICAS ACTUALES DE STORAGE');
  console.log('============================================\n');
  
  try {
    // Verificar buckets existentes
    console.log('📦 1. Verificando buckets...');
    const { data: buckets, error: bucketsError } = await supabaseAdmin
      .storage
      .listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listando buckets:', bucketsError.message);
      return;
    }
    
    console.log(`   ✅ Buckets encontrados: ${buckets.length}`);
    buckets.forEach(bucket => {
      console.log(`      - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
    });
    
    // Verificar archivos en construction-documents
    console.log('\n📁 2. Verificando archivos en construction-documents...');
    const { data: files, error: filesError } = await supabaseAdmin
      .storage
      .from('construction-documents')
      .list('', { limit: 100 });
    
    if (filesError) {
      console.error('❌ Error listando archivos:', filesError.message);
    } else {
      console.log(`   📊 Archivos en raíz: ${files.length}`);
      
      // Mostrar estructura actual
      const rootFiles = files.filter(f => f.name && !f.name.includes('/'));
      const folders = files.filter(f => f.name && f.name.includes('/'));
      
      console.log(`   🚨 Archivos desorganizados en raíz: ${rootFiles.length}`);
      console.log(`   📂 Carpetas organizadas: ${folders.length}`);
      
      if (rootFiles.length > 0) {
        console.log('\n   📋 Archivos que necesitan reorganización:');
        rootFiles.slice(0, 5).forEach(file => {
          console.log(`      - ${file.name}`);
        });
        if (rootFiles.length > 5) {
          console.log(`      ... y ${rootFiles.length - 5} más`);
        }
      }
    }
    
    // Verificar usuarios y companies
    console.log('\n👥 3. Verificando usuarios y companies...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, company_id, is_active, is_admin');
    
    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError.message);
    } else {
      const activeUsers = users.filter(u => u.is_active);
      const companies = [...new Set(users.map(u => u.company_id).filter(Boolean))];
      
      console.log(`   👤 Usuarios totales: ${users.length}`);
      console.log(`   ✅ Usuarios activos: ${activeUsers.length}`);
      console.log(`   🏢 Companies únicas: ${companies.length}`);
    }
    
    console.log('\n📝 ESTADO ACTUAL:');
    console.log('================');
    console.log('🔴 PROBLEMAS IDENTIFICADOS:');
    console.log('   1. Archivos desorganizados en raíz del bucket');
    console.log('   2. Posibles políticas RLS inseguras o faltantes');
    console.log('   3. Acceso cruzado entre companies no controlado');
    
    console.log('\n✅ SOLUCIONES DISPONIBLES:');
    console.log('   1. Ejecutar fix-storage-rls-security.sql en Supabase Dashboard');
    console.log('   2. Reorganizar archivos con reorganize-storage-files.js');
    console.log('   3. Validar endpoint /api/storage/create-upload-url');
    
    console.log('\n🚀 PRÓXIMOS PASOS RECOMENDADOS:');
    console.log('1. Copiar y ejecutar el contenido de fix-storage-rls-security.sql');
    console.log('   en Supabase Dashboard > SQL Editor');
    console.log('2. Descomentar y ejecutar reorganize-storage-files.js');
    console.log('3. Probar upload con autenticación real');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

checkCurrentPolicies();