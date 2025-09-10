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

// Mapeo de company IDs conocidos
const COMPANY_MAPPING = {
  'test-workspace-123': '57bffb9f-78ba-4252-a9ea-10adf83c3155',
  'test-company': '57bffb9f-78ba-4252-a9ea-10adf83c3155',
  'b6f547b4-e066-4737-8693-46199613f5fd': '57bffb9f-78ba-4252-a9ea-10adf83c3155', // Es un project_id
  '57bffb9f-78ba-4252-a9ea-10adf83c3155': '57bffb9f-78ba-4252-a9ea-10adf83c3155',
  '47e13ebd-c088-411e-ae3e-890561fb3421': '57bffb9f-78ba-4252-a9ea-10adf83c3155',
  '0ac85e2a-9ed6-416c-86fb-a95c11e5037b': '14d2c0ed-f148-4abb-a82e-d19fba9526a8',
  '0a54cf32-583f-46bf-a06f-6d4c520b5589': '14d2c0ed-f148-4abb-a82e-d19fba9526a8'
};

async function reorganizeStorageFiles() {
  console.log('📁 REORGANIZACIÓN DE ARCHIVOS DE STORAGE');
  console.log('=======================================\n');
  
  try {
    // 1. Obtener lista de archivos en la raíz
    console.log('📋 1. Obteniendo archivos en la raíz del bucket...');
    const { data: files, error: filesError } = await supabaseAdmin
      .storage
      .from('construction-documents')
      .list('', { limit: 100 });
    
    if (filesError) {
      console.error('❌ Error listando archivos:', filesError.message);
      return;
    }
    
    console.log(`📊 Archivos encontrados: ${files.length}`);
    
    // 2. Obtener información de proyectos para mapear correctamente
    console.log('\n🏗️ 2. Obteniendo información de proyectos...');
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('id, name, company_id');
    
    if (projectsError) {
      console.error('❌ Error obteniendo proyectos:', projectsError.message);
      return;
    }
    
    console.log(`📊 Proyectos encontrados: ${projects.length}`);
    
    // Crear mapeo de project_id -> company_id
    const projectToCompany = {};
    projects.forEach(project => {
      projectToCompany[project.id] = project.company_id;
    });
    
    // 3. Procesar cada archivo
    console.log('\n🔄 3. Procesando archivos para reorganización...');
    
    const reorganizationPlan = [];
    
    for (const file of files) {
      if (file.name && !file.name.includes('/')) {
        // Es un archivo en la raíz, necesita reorganización
        let targetCompanyId = null;
        let targetProjectId = null;
        
        // Intentar determinar company_id y project_id
        if (COMPANY_MAPPING[file.name]) {
          targetCompanyId = COMPANY_MAPPING[file.name];
        }
        
        // Si el nombre del archivo es un UUID, verificar si es un project_id
        if (projectToCompany[file.name]) {
          targetCompanyId = projectToCompany[file.name];
          targetProjectId = file.name;
        }
        
        // Si no se pudo determinar, usar company por defecto
        if (!targetCompanyId) {
          targetCompanyId = '57bffb9f-78ba-4252-a9ea-10adf83c3155'; // Company por defecto
        }
        
        // Si no hay project_id específico, usar uno por defecto
        if (!targetProjectId) {
          targetProjectId = 'b6f547b4-e066-4737-8693-46199613f5fd'; // Project por defecto
        }
        
        // Generar nueva ruta
        const newPath = `${targetCompanyId}/projects/${targetProjectId}/documentos-generales/${file.name}`;
        
        reorganizationPlan.push({
          currentPath: file.name,
          newPath: newPath,
          companyId: targetCompanyId,
          projectId: targetProjectId
        });
      }
    }
    
    console.log(`\n📋 Plan de reorganización (${reorganizationPlan.length} archivos):`);
    reorganizationPlan.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.currentPath}`);
      console.log(`      → ${plan.newPath}`);
    });
    
    // 4. Confirmar antes de proceder
    console.log('\n⚠️  IMPORTANTE: Esta operación moverá archivos en el storage.');
    console.log('   Para proceder, descomenta la sección de ejecución en el código.');
    
    // DESCOMENTA ESTA SECCIÓN PARA EJECUTAR LA REORGANIZACIÓN
    /*
    console.log('\n🚀 4. Ejecutando reorganización...');
    
    for (let i = 0; i < reorganizationPlan.length; i++) {
      const plan = reorganizationPlan[i];
      console.log(`\n📦 Procesando ${i + 1}/${reorganizationPlan.length}: ${plan.currentPath}`);
      
      try {
        // Mover archivo
        const { data: moveData, error: moveError } = await supabaseAdmin
          .storage
          .from('construction-documents')
          .move(plan.currentPath, plan.newPath);
        
        if (moveError) {
          console.error(`   ❌ Error moviendo archivo: ${moveError.message}`);
        } else {
          console.log(`   ✅ Archivo movido exitosamente`);
        }
        
        // Pequeña pausa para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`   ❌ Error inesperado: ${error.message}`);
      }
    }
    
    console.log('\n✅ Reorganización completada');
    */
    
    console.log('\n📝 PRÓXIMOS PASOS:');
    console.log('1. Revisar el plan de reorganización arriba');
    console.log('2. Si está correcto, descomentar la sección de ejecución');
    console.log('3. Ejecutar nuevamente el script');
    console.log('4. Verificar que los archivos se movieron correctamente');
    console.log('5. Aplicar las políticas RLS de seguridad');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

reorganizeStorageFiles();