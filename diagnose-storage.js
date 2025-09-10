const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Intentar cargar variables de entorno desde .env si faltan
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    const envPath = '.env';
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
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
    }
  } catch (e) {
    // Continuar sin bloquear si falla la carga de .env
  }
}

// Variables de entorno (deben estar configuradas en el sistema o .env)
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

// --- NUEVO: verificación puntual de un objeto ---
async function verifyObjectLocation(bucketName, fullPath) {
  console.log('\n🔎 Verificando ubicación de objeto en Storage...');
  console.log('🪣 Bucket:', bucketName);
  console.log('📍 Path completo:', fullPath);

  const parts = fullPath.split('/');
  const fileName = parts.pop();
  const dirPath = parts.join('/');

  try {
    const { data: entries, error: listError } = await supabase.storage
      .from(bucketName)
      .list(dirPath, { limit: 1000 });

    if (listError) {
      console.error('❌ Error listando directorio:', listError.message);
      return { ok: false, error: listError };
    }

    const match = entries?.find((e) => e.name === fileName);
    if (match) {
      console.log('✅ Archivo ENCONTRADO en la carpeta esperada.');
      console.log('📄 Nombre:', match.name);
      if (match.id) console.log('🆔 ID:', match.id);
      if (match.updated_at) console.log('🕒 Actualizado:', match.updated_at);
      if (typeof match.metadata?.size === 'number') console.log('📏 Tamaño:', match.metadata.size, 'bytes');

      // Intentar obtener URL pública (si el bucket es público)
      const { data: pub } = supabase.storage.from(bucketName).getPublicUrl(fullPath);
      if (pub?.publicUrl) {
        console.log('🔗 URL pública (si aplica):', pub.publicUrl);
      }

      return { ok: true };
    } else {
      console.log('❌ Archivo NO encontrado en ese directorio.');
      if (entries?.length >= 0) {
        const sample = entries.slice(0, 5).map(e => e.name).join(', ');
        console.log('📚 Contenido del directorio (primeros 5):', sample || '(vacío)');
      }
      return { ok: false };
    }
  } catch (e) {
    console.error('❌ Error verificando objeto:', e.message);
    return { ok: false, error: e };
  }
}

async function main() {
  // Si se pasan argumentos CLI: node diagnose-storage.js <bucket> <path>
  const [, , argBucket, argPath] = process.argv;
  if (argBucket && argPath) {
    await verifyObjectLocation(argBucket, argPath);
    return;
  }

  console.log('🚀 Iniciando diagnóstico de Supabase Storage\n');
  
  await diagnoseBuckets();
  
  console.log('\n✅ Diagnóstico completado');
}

main().catch(console.error);