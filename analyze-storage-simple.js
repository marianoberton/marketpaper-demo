const { createClient } = require('@supabase/supabase-js');

// Usar credenciales conocidas
const supabaseUrl = 'https://adouqsqyjasjucdgwqxv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkb3Vxc3F5amFzanVjZGd3cXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyODU4MzIsImV4cCI6MjA2NTg2MTgzMn0.t_vF7qPGlbf8y7UEUgKKDLxY9QQdRYKWwNQmqEKUzMs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function analyzeStorageSimple() {
  console.log('🔍 Analizando storage con cliente anónimo...');
  
  try {
    // 1. Verificar acceso a project_documents
    console.log('\n📋 Analizando registros en project_documents...');
    const { data: projectDocs, error: projectDocsError } = await supabase
      .from('project_documents')
      .select('id, project_id, file_path, file_name, created_at')
      .limit(20)
      .order('created_at', { ascending: false });
      
    if (projectDocsError) {
      console.error('❌ Error obteniendo project_documents:', projectDocsError.message);
    } else {
      console.log(`📊 Registros encontrados: ${projectDocs.length}`);
      
      // Analizar estructura de paths
      const pathStructure = {};
      const rootFiles = [];
      
      projectDocs.forEach(doc => {
        if (doc.file_path.includes('/')) {
          const pathParts = doc.file_path.split('/');
          const structure = pathParts.slice(0, -1).join('/');
          if (!pathStructure[structure]) {
            pathStructure[structure] = 0;
          }
          pathStructure[structure]++;
        } else {
          rootFiles.push(doc.file_path);
        }
      });
      
      console.log('\n📁 Estructura de paths en project_documents:');
      Object.entries(pathStructure).forEach(([path, count]) => {
        console.log(`   - ${path}: ${count} archivos`);
      });
      
      if (rootFiles.length > 0) {
        console.log(`\n⚠️  Archivos en la raíz: ${rootFiles.length}`);
      }
      
      console.log('\n📄 Documentos recientes:');
      projectDocs.slice(0, 10).forEach(doc => {
        console.log(`   - ${doc.file_name} (${doc.project_id}) - ${doc.file_path}`);
      });
    }
    
    // 2. Verificar proyectos asociados
    console.log('\n🏗️ Analizando proyectos...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, company_id')
      .limit(10);
      
    if (projectsError) {
      console.error('❌ Error obteniendo proyectos:', projectsError.message);
    } else {
      console.log(`📊 Proyectos encontrados: ${projects.length}`);
      
      // Agrupar por company_id
      const companiesProjects = {};
      projects.forEach(project => {
        if (!companiesProjects[project.company_id]) {
          companiesProjects[project.company_id] = [];
        }
        companiesProjects[project.company_id].push(project);
      });
      
      console.log('\n🏢 Proyectos por compañía:');
      Object.entries(companiesProjects).forEach(([companyId, companyProjects]) => {
        console.log(`   - Compañía ${companyId}: ${companyProjects.length} proyectos`);
        companyProjects.forEach(project => {
          console.log(`     * ${project.name || project.id}`);
        });
      });
    }
    
    // 3. Verificar companies
    console.log('\n🏢 Analizando compañías...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, created_at')
      .limit(10);
      
    if (companiesError) {
      console.error('❌ Error obteniendo compañías:', companiesError.message);
    } else {
      console.log(`📊 Compañías encontradas: ${companies.length}`);
      companies.forEach(company => {
        console.log(`   - ${company.name || company.id} (${company.created_at})`);
      });
    }
    
    console.log('\n✅ Análisis completado con cliente anónimo');
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Configurar service role key para análisis completo del storage');
    console.log('   2. Aplicar políticas RLS de seguridad');
    console.log('   3. Reorganizar archivos según estructura recomendada');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

analyzeStorageSimple();