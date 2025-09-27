const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://kcjqhqjqjqjqjqjq.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjanFocWpxanFqcWpxanEiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNzU1NzE4NCwiZXhwIjoyMDUzMTMzMTg0fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
);

async function checkDocuments() {
  try {
    console.log('🔍 Buscando documentos con "permiso" en section_name...');
    
    const { data: permisoData, error: permisoError } = await supabase
      .from('project_documents')
      .select('id, project_id, section_name, original_filename, created_at')
      .ilike('section_name', '%permiso%')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (permisoError) {
      console.error('❌ Error buscando documentos con "permiso":', permisoError);
    } else {
      console.log('📄 Documentos encontrados con "permiso" en section_name:');
      console.log(JSON.stringify(permisoData, null, 2));
    }

    console.log('\n🔍 Buscando documentos con section_name exacto "Permiso de obra"...');
    
    const { data: exactData, error: exactError } = await supabase
      .from('project_documents')
      .select('id, project_id, section_name, original_filename, created_at')
      .eq('section_name', 'Permiso de obra')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (exactError) {
      console.error('❌ Error buscando documentos exactos:', exactError);
    } else {
      console.log('📄 Documentos encontrados con section_name exacto "Permiso de obra":');
      console.log(JSON.stringify(exactData, null, 2));
    }

    console.log('\n🔍 Mostrando todos los section_name únicos...');
    
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('project_documents')
      .select('section_name')
      .order('section_name');
    
    if (sectionsError) {
      console.error('❌ Error obteniendo secciones:', sectionsError);
    } else {
      const uniqueSections = [...new Set(sectionsData.map(d => d.section_name))];
      console.log('📋 Secciones únicas encontradas:');
      uniqueSections.forEach(section => console.log(`  - "${section}"`));
    }
    
  } catch (e) {
    console.error('❌ Error general:', e.message);
  }
}

checkDocuments();