const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Función para cargar variables de entorno desde .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  }
  
  return env;
}

const env = loadEnvFile();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ Configurada' : '❌ Faltante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeStorageState() {
  console.log('🔍 Analizando estado actual del storage...');
  
  try {
    // 1. Listar buckets disponibles
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('❌ Error obteniendo buckets:', bucketsError.message);
      return;
    }
    
    console.log('\n📦 Buckets disponibles:');
    buckets.forEach(bucket => {
      const sizeLimit = bucket.file_size_limit ? Math.round(bucket.file_size_limit / 1024 / 1024) + 'MB' : 'Sin límite';
      console.log(`   - ${bucket.name} (${bucket.public ? 'público' : 'privado'}) - Límite: ${sizeLimit}`);
    });
    
    // 2. Analizar bucket construction-documents
    console.log('\n📄 Analizando bucket construction-documents...');
    const { data: files, error: filesError } = await supabase.storage
      .from('construction-documents')
      .list('', { 
        limit: 50, 
        sortBy: { column: 'created_at', order: 'desc' } 
      });
      
    if (filesError) {
      console.error('❌ Error listando archivos:', filesError.message);
      return;
    }
    
    console.log(`\n📊 Total de archivos encontrados: ${files.length}`);
    
    // Analizar estructura de carpetas
    const folderStructure = {};
    const rootFiles = [];
    
    files.forEach(file => {
      if (file.name.includes('/')) {
        const folder = file.name.split('/')[0];
        if (!folderStructure[folder]) {
          folderStructure[folder] = 0;
        }
        folderStructure[folder]++;
      } else {
        rootFiles.push(file.name);
      }
    });
    
    console.log('\n📁 Estructura de carpetas:');
    Object.entries(folderStructure).forEach(([folder, count]) => {
      console.log(`   - ${folder}/: ${count} archivos`);
    });
    
    if (rootFiles.length > 0) {
      console.log(`\n⚠️  Archivos en la raíz (sin organizar): ${rootFiles.length}`);
      rootFiles.slice(0, 10).forEach(file => {
        console.log(`   - ${file}`);
      });
      if (rootFiles.length > 10) {
        console.log(`   ... y ${rootFiles.length - 10} más`);
      }
    }
    
    // 3. Verificar políticas RLS
    console.log('\n🔒 Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'storage')
      .eq('tablename', 'objects');
      
    if (policiesError) {
      console.error('❌ Error obteniendo políticas:', policiesError.message);
    } else {
      console.log(`📋 Políticas RLS encontradas: ${policies.length}`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd}) - ${policy.permissive ? 'permisiva' : 'restrictiva'}`);
      });
    }
    
    // 4. Verificar registros en project_documents
    console.log('\n📋 Verificando registros en project_documents...');
    const { data: projectDocs, error: projectDocsError } = await supabase
      .from('project_documents')
      .select('id, project_id, file_path, file_name, created_at')
      .limit(10)
      .order('created_at', { ascending: false });
      
    if (projectDocsError) {
      console.error('❌ Error obteniendo project_documents:', projectDocsError.message);
    } else {
      console.log(`📊 Registros recientes en project_documents: ${projectDocs.length}`);
      projectDocs.forEach(doc => {
        console.log(`   - ${doc.file_name} (proyecto: ${doc.project_id}) - ${doc.file_path}`);
      });
    }
    
    console.log('\n✅ Análisis completado');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

analyzeStorageState();