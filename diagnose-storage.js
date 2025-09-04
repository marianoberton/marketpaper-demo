const { createClient } = require('@supabase/supabase-js');

// Variables de entorno (deben estar configuradas en el sistema)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseBuckets() {
  console.log('🔍 Diagnosticando buckets de Supabase Storage...');
  
  const requiredBuckets = [
    'docs',
    'construction-documents',
    'finance-imports',
    'company-logos'
  ];
  
  try {
    // Listar todos los buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error al listar buckets:', bucketsError);
      return;
    }
    
    console.log('\n📦 Buckets disponibles:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
    });
    
    console.log('\n✅ Verificando buckets requeridos:');
    for (const bucketName of requiredBuckets) {
      const exists = buckets.some(b => b.name === bucketName);
      console.log(`  - ${bucketName}: ${exists ? '✅' : '❌'}`);
      
      if (exists) {
        // Probar crear una URL firmada
        try {
          const testPath = `test/diagnostic-${Date.now()}.txt`;
          const { data: signedUrl, error: urlError } = await supabase.storage
            .from(bucketName)
            .createSignedUploadUrl(testPath, { upsert: false });
            
          if (urlError) {
            console.log(`    ⚠️  Error creando URL firmada: ${urlError.message}`);
          } else {
            console.log(`    ✅ URL firmada creada exitosamente`);
          }
        } catch (e) {
          console.log(`    ❌ Error en prueba de URL firmada: ${e.message}`);
        }
      }
    }
    
    // Verificar políticas RLS
    console.log('\n🔒 Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabase
      .from('storage.policies')
      .select('*');
      
    if (policiesError) {
      console.log('⚠️  No se pudieron obtener las políticas RLS');
    } else {
      console.log(`📋 Políticas encontradas: ${policies?.length || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

async function testAuthentication() {
  console.log('\n🔐 Probando autenticación...');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('⚠️  Error de autenticación (esperado en servidor):', error.message);
    } else {
      console.log('✅ Usuario autenticado:', user?.email || 'Sin email');
    }
  } catch (e) {
    console.log('⚠️  Error en prueba de autenticación:', e.message);
  }
}

async function main() {
  console.log('🚀 Iniciando diagnóstico de Supabase Storage\n');
  
  await testAuthentication();
  await diagnoseBuckets();
  
  console.log('\n✅ Diagnóstico completado');
}

main().catch(console.error);