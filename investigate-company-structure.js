const { createClient } = require('@supabase/supabase-js');

async function investigateStructure() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('🔍 Investigando estructura de empresas y proyectos...\n');
    
    // 1. Ver todas las empresas
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name, created_at')
      .order('name');
    
    console.log('🏢 Empresas en el sistema:');
    companies.forEach(c => {
      console.log(`   - ${c.name} (ID: ${c.id})`);
    });
    
    // 2. Ver usuarios de Inted
    const intedCompany = companies.find(c => c.name.toLowerCase().includes('inted'));
    if (intedCompany) {
      console.log(`\n👥 Usuarios de ${intedCompany.name}:`);
      const { data: intedUsers } = await supabase
        .from('user_profiles')
        .select('email, role, company_id')
        .eq('company_id', intedCompany.id);
      
      intedUsers.forEach(u => {
        console.log(`   - ${u.email}: ${u.role}`);
      });
      
      // 3. Ver proyectos asociados a Inted
      console.log(`\n📋 Proyectos de ${intedCompany.name}:`);
      const { data: intedProjects } = await supabase
        .from('projects')
        .select('id, name, company_id')
        .eq('company_id', intedCompany.id);
      
      intedProjects.forEach(p => {
        console.log(`   - ${p.name} (ID: ${p.id})`);
      });
      
      // 4. Ver pagos de esos proyectos
      if (intedProjects.length > 0) {
        console.log(`\n💰 Pagos de proyectos de ${intedCompany.name}:`);
        const projectIds = intedProjects.map(p => p.id);
        const { data: payments } = await supabase
          .from('tax_payments')
          .select(`
            id,
            amount,
            description,
            project_id,
            projects!inner(name, company_id)
          `)
          .in('project_id', projectIds)
          .limit(5);
        
        payments.forEach(p => {
          console.log(`   - $${p.amount} en ${p.projects.name} (Pago ID: ${p.id})`);
        });
      }
    }
    
    // 5. Ver estructura de tabla companies
    const { data: companiesWithParent } = await supabase
      .from('companies')
      .select('*')
      .limit(3);
    
    console.log(`\n🔗 Estructura de tabla companies:`);
    if (companiesWithParent.length > 0) {
      console.log('Columnas:', Object.keys(companiesWithParent[0]));
    }
    
    // 6. Verificar si hay algún campo que indique jerarquía
    console.log('\n🔍 Buscando campos de jerarquía en companies...');
    const sampleCompany = companiesWithParent[0];
    const hierarchyFields = Object.keys(sampleCompany).filter(key => 
      key.includes('parent') || key.includes('owner') || key.includes('client')
    );
    
    if (hierarchyFields.length > 0) {
      console.log('Campos de jerarquía encontrados:', hierarchyFields);
    } else {
      console.log('No se encontraron campos de jerarquía obvios');
    }
    
  } catch (err) {
    console.error('💥 Error:', err);
  }
}

investigateStructure();