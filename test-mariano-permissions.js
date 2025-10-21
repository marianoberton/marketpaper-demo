const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMarianoPermissions() {
  console.log('=== Investigando permisos de mariano@mariano.com ===\n');

  try {
    // 1. Buscar el usuario mariano@mariano.com
    const { data: marianoUser, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, role, company_id, full_name')
      .eq('email', 'mariano@mariano.com')
      .single();

    if (userError) {
      console.error('Error buscando usuario mariano:', userError);
      return;
    }

    if (!marianoUser) {
      console.log('Usuario mariano@mariano.com no encontrado');
      return;
    }

    console.log('Usuario encontrado:');
    console.log('- Email:', marianoUser.email);
    console.log('- Role:', marianoUser.role);
    console.log('- Company ID:', marianoUser.company_id);
    console.log('- Full Name:', marianoUser.full_name);
    console.log();

    // 2. Buscar información de la empresa
    if (marianoUser.company_id) {
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, name, type')
        .eq('id', marianoUser.company_id)
        .single();

      if (!companyError && company) {
        console.log('Empresa del usuario:');
        console.log('- ID:', company.id);
        console.log('- Name:', company.name);
        console.log('- Type:', company.type);
        console.log();
      }
    }

    // 3. Buscar proyectos de la misma empresa
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, company_id')
      .eq('company_id', marianoUser.company_id);

    console.log(`Proyectos de la empresa (${projects?.length || 0}):`);
    if (projects && projects.length > 0) {
      projects.forEach(project => {
        console.log(`- ${project.name} (ID: ${project.id})`);
      });
    } else {
      console.log('- No hay proyectos en esta empresa');
    }
    console.log();

    // 4. Buscar pagos de esos proyectos
    if (projects && projects.length > 0) {
      const projectIds = projects.map(p => p.id);
      
      const { data: payments, error: paymentsError } = await supabase
        .from('tax_payments')
        .select(`
          id, 
          amount, 
          description,
          project_id,
          projects!inner(id, name, company_id)
        `)
        .in('project_id', projectIds);

      console.log(`Pagos en proyectos de la empresa (${payments?.length || 0}):`);
      if (payments && payments.length > 0) {
        payments.forEach(payment => {
          console.log(`- Pago ID: ${payment.id}, Monto: ${payment.amount}, Proyecto: ${payment.projects.name}`);
        });
        
        // 5. Simular verificación de permisos para el primer pago
        const firstPayment = payments[0];
        console.log('\n=== Simulando verificación de permisos ===');
        console.log('Usuario:', marianoUser.email, '- Role:', marianoUser.role, '- Company:', marianoUser.company_id);
        console.log('Pago:', firstPayment.id, '- Proyecto Company:', firstPayment.projects.company_id);
        
        const canDelete = 
          marianoUser.role === 'super_admin' ||
          (firstPayment.projects.company_id === marianoUser.company_id && 
           ['company_owner', 'company_admin', 'manager', 'employee'].includes(marianoUser.role));
        
        console.log('¿Puede eliminar?', canDelete);
        console.log('Razón:', 
          marianoUser.role === 'super_admin' ? 'Es super_admin' :
          firstPayment.projects.company_id === marianoUser.company_id ? 
            (['company_owner', 'company_admin', 'manager', 'employee'].includes(marianoUser.role) ? 
              'Mismo company_id y rol permitido' : 'Mismo company_id pero rol no permitido') :
            'Diferente company_id'
        );
      } else {
        console.log('- No hay pagos en los proyectos de esta empresa');
      }
    }

    // 6. Buscar TODOS los pagos para ver si hay alguno que pueda eliminar
    console.log('\n=== Buscando TODOS los pagos para verificar ===');
    const { data: allPayments, error: allPaymentsError } = await supabase
      .from('tax_payments')
      .select(`
        id, 
        amount, 
        description,
        project_id,
        projects!inner(id, name, company_id)
      `)
      .limit(5);

    if (allPayments && allPayments.length > 0) {
      console.log('Primeros 5 pagos en el sistema:');
      allPayments.forEach(payment => {
        const canDelete = 
          marianoUser.role === 'super_admin' ||
          (payment.projects.company_id === marianoUser.company_id && 
           ['company_owner', 'company_admin', 'manager', 'employee'].includes(marianoUser.role));
        
        console.log(`- Pago ${payment.id}: Company ${payment.projects.company_id} - ¿Puede eliminar? ${canDelete}`);
      });
    }

  } catch (error) {
    console.error('Error en la investigación:', error);
  }
}

testMarianoPermissions();