const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer variables de entorno desde .env manualmente
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Archivo .env no encontrado');
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
  
  console.log('✅ Variables de entorno cargadas desde .env');
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

async function checkData() {
  console.log('=== VERIFICACIÓN DE DATOS DEL MÓDULO CONSTRUCCIÓN ===\n');
  
  try {
    // Verificar proyectos
    console.log('📋 VERIFICANDO PROYECTOS...');
    const { data: projects, error: projectsError, count: projectsCount } = await supabase
      .from('projects')
      .select('id, name, company_id, created_at', { count: 'exact' })
      .limit(10);
    
    if (projectsError) {
      console.error('❌ Error al consultar proyectos:', projectsError.message);
    } else {
      console.log(`✅ Proyectos encontrados: ${projectsCount || 0}`);
      if (projects && projects.length > 0) {
        console.log('Últimos proyectos:');
        projects.forEach(p => console.log(`  - ${p.name} (${p.id}) - ${p.created_at}`));
      }
    }
    
    // Verificar clientes
    console.log('\n👥 VERIFICANDO CLIENTES...');
    const { data: clients, error: clientsError, count: clientsCount } = await supabase
      .from('clients')
      .select('id, name, company_id, created_at', { count: 'exact' })
      .limit(10);
    
    if (clientsError) {
      console.error('❌ Error al consultar clientes:', clientsError.message);
    } else {
      console.log(`✅ Clientes encontrados: ${clientsCount || 0}`);
      if (clients && clients.length > 0) {
        console.log('Últimos clientes:');
        clients.forEach(c => console.log(`  - ${c.name} (${c.id}) - ${c.created_at}`));
      }
    }
    
    // Verificar compañías
    console.log('\n🏢 VERIFICANDO COMPAÑÍAS...');
    const { data: companies, error: companiesError, count: companiesCount } = await supabase
      .from('companies')
      .select('id, name, created_at', { count: 'exact' })
      .limit(5);
    
    if (companiesError) {
      console.error('❌ Error al consultar compañías:', companiesError.message);
    } else {
      console.log(`✅ Compañías encontradas: ${companiesCount || 0}`);
      if (companies && companies.length > 0) {
        console.log('Compañías existentes:');
        companies.forEach(c => console.log(`  - ${c.name} (${c.id}) - ${c.created_at}`));
      }
    }
    
    // Verificar documentos de proyectos
    console.log('\n📄 VERIFICANDO DOCUMENTOS DE PROYECTOS...');
    const { data: documents, error: documentsError, count: documentsCount } = await supabase
      .from('project_documents')
      .select('id, filename, project_id, created_at', { count: 'exact' })
      .limit(10);
    
    if (documentsError) {
      console.error('❌ Error al consultar documentos:', documentsError.message);
    } else {
      console.log(`✅ Documentos encontrados: ${documentsCount || 0}`);
      if (documents && documents.length > 0) {
        console.log('Últimos documentos:');
        documents.forEach(d => console.log(`  - ${d.filename} (Proyecto: ${d.project_id}) - ${d.created_at}`));
      }
    }
    
    console.log('\n=== RESUMEN ===');
    console.log(`📋 Proyectos: ${projectsCount || 0}`);
    console.log(`👥 Clientes: ${clientsCount || 0}`);
    console.log(`🏢 Compañías: ${companiesCount || 0}`);
    console.log(`📄 Documentos: ${documentsCount || 0}`);
    
    if ((projectsCount || 0) === 0 && (clientsCount || 0) === 0) {
      console.log('\n🚨 ALERTA: No se encontraron proyectos ni clientes. Posible pérdida de datos.');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

checkData().catch(console.error);