const { createClient } = require('@supabase/supabase-js');

async function debugPaymentPermissions() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('🔍 Investigando permisos de eliminación de pagos...\n');
    
    // 1. Verificar usuarios existentes
    console.log('1. Usuarios en el sistema:');
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, email, role, company_id, full_name')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
      return;
    }
    
    users.forEach(user => {
      console.log(`   - ${user.email}: ${user.role} (company: ${user.company_id})`);
    });
    
    // 2. Verificar pagos existentes
    console.log('\n2. Pagos en el sistema:');
    const { data: payments, error: paymentsError } = await supabase
      .from('tax_payments')
      .select(`
        id,
        amount,
        description,
        project_id,
        projects!inner(company_id, name)
      `)
      .limit(3);
    
    if (paymentsError) {
      console.error('❌ Error obteniendo pagos:', paymentsError);
      return;
    }
    
    payments.forEach(payment => {
      console.log(`   - Pago ${payment.id}: $${payment.amount} (proyecto: ${payment.projects.name}, company: ${payment.projects.company_id})`);
    });
    
    // 3. Simular verificación de permisos
    console.log('\n3. Simulando verificación de permisos:');
    
    const testUser = users.find(u => u.role !== 'super_admin');
    if (testUser && payments.length > 0) {
      const testPayment = payments[0];
      
      console.log(`   Usuario de prueba: ${testUser.email} (${testUser.role})`);
      console.log(`   Company del usuario: ${testUser.company_id}`);
      console.log(`   Company del pago: ${testPayment.projects.company_id}`);
      
      const canDelete = testUser.role === 'super_admin' || 
                       testPayment.projects.company_id === testUser.company_id;
      
      console.log(`   ¿Puede eliminar?: ${canDelete ? '✅ SÍ' : '❌ NO'}`);
      
      if (!canDelete) {
        console.log('   🔍 Razón: Las company_id no coinciden o no es super_admin');
      }
    }
    
  } catch (err) {
    console.error('💥 Error general:', err);
  }
}

debugPaymentPermissions();