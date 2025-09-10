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

// Cliente con service role para pruebas administrativas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testStorageRLSSecurity() {
  console.log('🔒 PRUEBA DE SEGURIDAD RLS EN STORAGE');
  console.log('=====================================\n');
  
  try {
    // 1. Verificar políticas aplicadas
    console.log('📋 1. Verificando políticas RLS aplicadas...');
    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT 
            policyname,
            cmd,
            CASE 
              WHEN 'public' = ANY(roles) THEN '🚨 PÚBLICO'
              WHEN 'authenticated' = ANY(roles) THEN '✅ AUTENTICADO'
              ELSE '❓ OTRO'
            END as security_level
          FROM pg_policies 
          WHERE schemaname = 'storage' 
            AND tablename = 'objects'
            AND policyname LIKE '%construction%' OR policyname LIKE '%project%'
          ORDER BY policyname;
        `
      });
    
    if (policiesError) {
      console.log('⚠️  No se pudieron verificar políticas directamente');
    } else {
      console.log('Políticas encontradas:', policies?.length || 0);
    }
    
    // 2. Verificar estructura de archivos existentes
    console.log('\n📁 2. Analizando estructura de archivos existentes...');
    const { data: files, error: filesError } = await supabaseAdmin
      .storage
      .from('construction-documents')
      .list('', { limit: 100 });
    
    if (filesError) {
      console.error('❌ Error listando archivos:', filesError.message);
    } else {
      console.log(`📊 Archivos encontrados: ${files.length}`);
      
      // Analizar estructura de paths
      const pathAnalysis = {
        correctStructure: 0,
        incorrectStructure: 0,
        rootFiles: 0
      };
      
      files.forEach(file => {
        if (file.name.includes('/')) {
          // Verificar si sigue el patrón: company_id/projects/project_id/...
          const pathParts = file.name.split('/');
          if (pathParts.length >= 3 && pathParts[1] === 'projects') {
            pathAnalysis.correctStructure++;
          } else {
            pathAnalysis.incorrectStructure++;
          }
        } else {
          pathAnalysis.rootFiles++;
        }
      });
      
      console.log('\n📈 Análisis de estructura:');
      console.log(`   ✅ Estructura correcta: ${pathAnalysis.correctStructure}`);
      console.log(`   ⚠️  Estructura incorrecta: ${pathAnalysis.incorrectStructure}`);
      console.log(`   🚨 Archivos en raíz: ${pathAnalysis.rootFiles}`);
      
      if (pathAnalysis.rootFiles > 0 || pathAnalysis.incorrectStructure > 0) {
        console.log('\n⚠️  RECOMENDACIÓN: Reorganizar archivos según estructura:');
        console.log('   company_id/projects/project_id/section/filename');
      }
    }
    
    // 3. Verificar usuarios y companies
    console.log('\n👥 3. Verificando usuarios y companies...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, company_id, status, role')
      .limit(10);
    
    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError.message);
    } else {
      console.log(`👤 Usuarios encontrados: ${users.length}`);
      
      const companiesCount = new Set(users.map(u => u.company_id)).size;
      console.log(`🏢 Companies únicas: ${companiesCount}`);
      
      // Mostrar distribución por company
      const companyDistribution = {};
      users.forEach(user => {
        if (!companyDistribution[user.company_id]) {
          companyDistribution[user.company_id] = { total: 0, active: 0, admins: 0 };
        }
        companyDistribution[user.company_id].total++;
        if (user.status === 'active') {
          companyDistribution[user.company_id].active++;
        }
        if (['admin', 'owner', 'company_admin', 'company_owner'].includes(user.role)) {
          companyDistribution[user.company_id].admins++;
        }
      });
      
      console.log('\n🏢 Distribución por company:');
      Object.entries(companyDistribution).forEach(([companyId, stats]) => {
        console.log(`   - ${companyId}: ${stats.total} usuarios (${stats.active} activos, ${stats.admins} admins)`);
      });
    }
    
    // 4. Recomendaciones de seguridad
    console.log('\n🔐 4. RECOMENDACIONES DE SEGURIDAD:');
    console.log('=====================================');
    console.log('✅ 1. Aplicar fix-storage-rls-security.sql en Supabase Dashboard');
    console.log('✅ 2. Verificar que NO existan políticas públicas');
    console.log('✅ 3. Reorganizar archivos según estructura company_id/projects/...');
    console.log('✅ 4. Probar acceso con usuarios de diferentes companies');
    console.log('✅ 5. Validar que usuarios inactivos no puedan acceder');
    
    console.log('\n📝 PRÓXIMOS PASOS:');
    console.log('1. Ejecutar el script SQL de seguridad');
    console.log('2. Reorganizar archivos existentes');
    console.log('3. Probar upload con autenticación real');
    console.log('4. Validar endpoint /api/storage/create-upload-url');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

testStorageRLSSecurity();