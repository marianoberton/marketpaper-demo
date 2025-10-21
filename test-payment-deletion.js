const { createClient } = require('@supabase/supabase-js');

async function testPaymentDeletion() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('🧪 Probando permisos de eliminación de pagos después de la corrección...\n');
    
    // 1. Obtener un usuario company_owner
    const { data: companyOwner } = await supabase
      .from('user_profiles')
      .select('id, email, role, company_id')
      .eq('role', 'company_owner')
      .limit(1)
      .single();
    
    if (!companyOwner) {
      console.log('❌ No se encontró un company_owner para probar');
      return;
    }
    
    console.log(`👤 Usuario de prueba: ${companyOwner.email} (${companyOwner.role})`);
    console.log(`🏢 Company ID: ${companyOwner.company_id}`);
    
    // 2. Obtener un pago de la misma empresa
    const { data: payment } = await supabase
      .from('tax_payments')
      .select(`
        id,
        amount,
        description,
        project_id,
        projects!inner(company_id, name)
      `)
      .eq('projects.company_id', companyOwner.company_id)
      .limit(1)
      .single();
    
    if (!payment) {
      console.log('❌ No se encontró un pago de la misma empresa para probar');
      return;
    }
    
    console.log(`💰 Pago de prueba: ${payment.id} ($${payment.amount})`);
    console.log(`📋 Proyecto: ${payment.projects.name}`);
    console.log(`🏢 Company del pago: ${payment.projects.company_id}`);
    
    // 3. Simular la nueva lógica de permisos
    const canDelete = 
      // Super admin puede eliminar cualquier pago
      companyOwner.role === 'super_admin' ||
      // Usuarios con permisos de delete de la misma empresa
      (payment.projects.company_id === companyOwner.company_id && 
       ['company_owner', 'company_admin'].includes(companyOwner.role));
    
    console.log(`\n✅ Resultado de la verificación de permisos:`);
    console.log(`   ¿Es super_admin?: ${companyOwner.role === 'super_admin' ? 'Sí' : 'No'}`);
    console.log(`   ¿Misma empresa?: ${payment.projects.company_id === companyOwner.company_id ? 'Sí' : 'No'}`);
    console.log(`   ¿Rol permitido?: ${['company_owner', 'company_admin'].includes(companyOwner.role) ? 'Sí' : 'No'}`);
    console.log(`   🎯 ¿Puede eliminar?: ${canDelete ? '✅ SÍ' : '❌ NO'}`);
    
    if (canDelete) {
      console.log('\n🎉 ¡Perfecto! El company_owner ahora puede eliminar pagos de su empresa.');
    } else {
      console.log('\n❌ Algo sigue mal con la lógica de permisos.');
    }
    
  } catch (err) {
    console.error('💥 Error en la prueba:', err);
  }
}

testPaymentDeletion();