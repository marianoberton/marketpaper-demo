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

async function executeSQL(query, description) {
  console.log(`\n🔧 ${description}...`);
  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql_query: query });
    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      return false;
    }
    console.log(`   ✅ Completado`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error inesperado: ${error.message}`);
    return false;
  }
}

async function applyRLSSecurity() {
  console.log('🔒 APLICANDO POLÍTICAS RLS DE SEGURIDAD');
  console.log('=====================================\n');
  
  try {
    // 1. Eliminar políticas peligrosas existentes
    console.log('🧹 1. Eliminando políticas peligrosas...');
    
    const dangerousPolicies = [
      'DROP POLICY IF EXISTS "Allow anonymous upload" ON storage.objects;',
      'DROP POLICY IF EXISTS "Allow public read" ON storage.objects;',
      'DROP POLICY IF EXISTS "Allow public modify" ON storage.objects;',
      'DROP POLICY IF EXISTS "Allow public delete" ON storage.objects;',
      'DROP POLICY IF EXISTS "Allow all access" ON storage.objects;',
      'DROP POLICY IF EXISTS "construction_documents_select" ON storage.objects;',
      'DROP POLICY IF EXISTS "construction_documents_insert" ON storage.objects;',
      'DROP POLICY IF EXISTS "construction_documents_update" ON storage.objects;',
      'DROP POLICY IF EXISTS "construction_documents_delete" ON storage.objects;',
      'DROP POLICY IF EXISTS "project_images_select" ON storage.objects;',
      'DROP POLICY IF EXISTS "project_images_insert" ON storage.objects;',
      'DROP POLICY IF EXISTS "project_images_update" ON storage.objects;',
      'DROP POLICY IF EXISTS "project_images_delete" ON storage.objects;',
      'DROP POLICY IF EXISTS "company_logos_select" ON storage.objects;',
      'DROP POLICY IF EXISTS "company_logos_insert" ON storage.objects;',
      'DROP POLICY IF EXISTS "company_logos_update" ON storage.objects;',
      'DROP POLICY IF EXISTS "company_logos_delete" ON storage.objects;'
    ];
    
    for (const policy of dangerousPolicies) {
      await executeSQL(policy, `Eliminando política peligrosa`);
    }
    
    // 2. Crear función auxiliar para verificar company_id
    console.log('\n🔧 2. Creando función auxiliar...');
    
    const helperFunction = `
      CREATE OR REPLACE FUNCTION auth.get_user_company_id()
      RETURNS uuid
      LANGUAGE sql
      SECURITY DEFINER
      AS $$
        SELECT company_id 
        FROM user_profiles 
        WHERE user_id = auth.uid() 
          AND is_active = true
        LIMIT 1;
      $$;
    `;
    
    await executeSQL(helperFunction, 'Creando función auxiliar get_user_company_id');
    
    // 3. Crear políticas seguras para construction-documents
    console.log('\n🏗️ 3. Aplicando políticas para construction-documents...');
    
    const constructionPolicies = [
      // INSERT - Solo miembros activos de la company
      `CREATE POLICY "construction_docs_insert_secure" ON storage.objects
       FOR INSERT TO authenticated
       WITH CHECK (
         bucket_id = 'construction-documents' AND
         (storage.foldername(name))[1] = auth.get_user_company_id()::text AND
         EXISTS (
           SELECT 1 FROM user_profiles 
           WHERE user_id = auth.uid() 
             AND company_id = (storage.foldername(name))[1]::uuid 
             AND is_active = true
         )
       );`,
      
      // SELECT - Solo miembros activos de la company
      `CREATE POLICY "construction_docs_select_secure" ON storage.objects
       FOR SELECT TO authenticated
       USING (
         bucket_id = 'construction-documents' AND
         (storage.foldername(name))[1] = auth.get_user_company_id()::text AND
         EXISTS (
           SELECT 1 FROM user_profiles 
           WHERE user_id = auth.uid() 
             AND company_id = (storage.foldername(name))[1]::uuid 
             AND is_active = true
         )
       );`,
      
      // UPDATE - Solo miembros activos de la company
      `CREATE POLICY "construction_docs_update_secure" ON storage.objects
       FOR UPDATE TO authenticated
       USING (
         bucket_id = 'construction-documents' AND
         (storage.foldername(name))[1] = auth.get_user_company_id()::text AND
         EXISTS (
           SELECT 1 FROM user_profiles 
           WHERE user_id = auth.uid() 
             AND company_id = (storage.foldername(name))[1]::uuid 
             AND is_active = true
         )
       );`,
      
      // DELETE - Solo admins activos de la company
      `CREATE POLICY "construction_docs_delete_secure" ON storage.objects
       FOR DELETE TO authenticated
       USING (
         bucket_id = 'construction-documents' AND
         (storage.foldername(name))[1] = auth.get_user_company_id()::text AND
         EXISTS (
           SELECT 1 FROM user_profiles 
           WHERE user_id = auth.uid() 
             AND company_id = (storage.foldername(name))[1]::uuid 
             AND is_active = true 
             AND is_admin = true
         )
       );`
    ];
    
    for (const policy of constructionPolicies) {
      await executeSQL(policy, 'Aplicando política de construction-documents');
    }
    
    // 4. Crear políticas seguras para project-images
    console.log('\n🖼️ 4. Aplicando políticas para project-images...');
    
    const projectImagesPolicies = [
      // INSERT
      `CREATE POLICY "project_images_insert_secure" ON storage.objects
       FOR INSERT TO authenticated
       WITH CHECK (
         bucket_id = 'project-images' AND
         (storage.foldername(name))[1] = auth.get_user_company_id()::text AND
         EXISTS (
           SELECT 1 FROM user_profiles 
           WHERE user_id = auth.uid() 
             AND company_id = (storage.foldername(name))[1]::uuid 
             AND is_active = true
         )
       );`,
      
      // SELECT
      `CREATE POLICY "project_images_select_secure" ON storage.objects
       FOR SELECT TO authenticated
       USING (
         bucket_id = 'project-images' AND
         (storage.foldername(name))[1] = auth.get_user_company_id()::text AND
         EXISTS (
           SELECT 1 FROM user_profiles 
           WHERE user_id = auth.uid() 
             AND company_id = (storage.foldername(name))[1]::uuid 
             AND is_active = true
         )
       );`,
      
      // UPDATE
      `CREATE POLICY "project_images_update_secure" ON storage.objects
       FOR UPDATE TO authenticated
       USING (
         bucket_id = 'project-images' AND
         (storage.foldername(name))[1] = auth.get_user_company_id()::text AND
         EXISTS (
           SELECT 1 FROM user_profiles 
           WHERE user_id = auth.uid() 
             AND company_id = (storage.foldername(name))[1]::uuid 
             AND is_active = true
         )
       );`,
      
      // DELETE - Solo admins
      `CREATE POLICY "project_images_delete_secure" ON storage.objects
       FOR DELETE TO authenticated
       USING (
         bucket_id = 'project-images' AND
         (storage.foldername(name))[1] = auth.get_user_company_id()::text AND
         EXISTS (
           SELECT 1 FROM user_profiles 
           WHERE user_id = auth.uid() 
             AND company_id = (storage.foldername(name))[1]::uuid 
             AND is_active = true 
             AND is_admin = true
         )
       );`
    ];
    
    for (const policy of projectImagesPolicies) {
      await executeSQL(policy, 'Aplicando política de project-images');
    }
    
    // 5. Crear políticas para company-logos
    console.log('\n🏢 5. Aplicando políticas para company-logos...');
    
    const companyLogosPolicies = [
      // INSERT - Solo admins de la company
      `CREATE POLICY "company_logos_insert_secure" ON storage.objects
       FOR INSERT TO authenticated
       WITH CHECK (
         bucket_id = 'company-logos' AND
         (storage.foldername(name))[1] = auth.get_user_company_id()::text AND
         EXISTS (
           SELECT 1 FROM user_profiles 
           WHERE user_id = auth.uid() 
             AND company_id = (storage.foldername(name))[1]::uuid 
             AND is_active = true 
             AND is_admin = true
         )
       );`,
      
      // SELECT - Todos los miembros activos
      `CREATE POLICY "company_logos_select_secure" ON storage.objects
       FOR SELECT TO authenticated
       USING (
         bucket_id = 'company-logos' AND
         (storage.foldername(name))[1] = auth.get_user_company_id()::text AND
         EXISTS (
           SELECT 1 FROM user_profiles 
           WHERE user_id = auth.uid() 
             AND company_id = (storage.foldername(name))[1]::uuid 
             AND is_active = true
         )
       );`,
      
      // UPDATE - Solo admins
      `CREATE POLICY "company_logos_update_secure" ON storage.objects
       FOR UPDATE TO authenticated
       USING (
         bucket_id = 'company-logos' AND
         (storage.foldername(name))[1] = auth.get_user_company_id()::text AND
         EXISTS (
           SELECT 1 FROM user_profiles 
           WHERE user_id = auth.uid() 
             AND company_id = (storage.foldername(name))[1]::uuid 
             AND is_active = true 
             AND is_admin = true
         )
       );`,
      
      // DELETE - Solo admins
      `CREATE POLICY "company_logos_delete_secure" ON storage.objects
       FOR DELETE TO authenticated
       USING (
         bucket_id = 'company-logos' AND
         (storage.foldername(name))[1] = auth.get_user_company_id()::text AND
         EXISTS (
           SELECT 1 FROM user_profiles 
           WHERE user_id = auth.uid() 
             AND company_id = (storage.foldername(name))[1]::uuid 
             AND is_active = true 
             AND is_admin = true
         )
       );`
    ];
    
    for (const policy of companyLogosPolicies) {
      await executeSQL(policy, 'Aplicando política de company-logos');
    }
    
    // 6. Verificar que RLS esté habilitado
    console.log('\n🔒 6. Verificando RLS...');
    await executeSQL('ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;', 'Habilitando RLS en storage.objects');
    
    console.log('\n✅ POLÍTICAS RLS APLICADAS EXITOSAMENTE');
    console.log('=====================================');
    console.log('🔐 Seguridad implementada:');
    console.log('   ✅ Acceso basado en company_id');
    console.log('   ✅ Solo usuarios activos pueden acceder');
    console.log('   ✅ Solo admins pueden eliminar');
    console.log('   ✅ Estructura de carpetas obligatoria');
    console.log('\n📝 PRÓXIMOS PASOS:');
    console.log('1. Reorganizar archivos existentes');
    console.log('2. Probar upload con autenticación');
    console.log('3. Validar endpoint /api/storage/create-upload-url');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

applyRLSSecurity();