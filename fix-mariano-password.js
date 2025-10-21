const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMarianoPassword() {
  console.log('=== Arreglando contraseña de mariano@mariano.com ===\n');

  try {
    // 1. Buscar el usuario en auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error listando usuarios:', authError);
      return;
    }

    const marianoAuth = authUsers.users.find(u => u.email === 'mariano@mariano.com');
    
    if (!marianoAuth) {
      console.log('❌ Usuario no encontrado en auth.users');
      return;
    }

    console.log('✅ Usuario encontrado en auth:', marianoAuth.id);

    // 2. Actualizar la contraseña usando admin API
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      marianoAuth.id,
      { 
        password: 'password123',
        email_confirm: true
      }
    );

    if (updateError) {
      console.error('❌ Error actualizando contraseña:', updateError);
      return;
    }

    console.log('✅ Contraseña actualizada correctamente');

    // 3. Probar login
    console.log('\n=== Probando login con nueva contraseña ===');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'mariano@mariano.com',
      password: 'password123'
    });

    if (loginError) {
      console.error('❌ Error en login:', loginError);
    } else {
      console.log('✅ Login exitoso!');
      console.log('- User ID:', loginData.user.id);
      console.log('- Email:', loginData.user.email);
      
      // 4. Ahora probar la eliminación de un pago
      console.log('\n=== Probando eliminación de pago ===');
      
      // Buscar un pago de su empresa
      const { data: payments, error: paymentsError } = await supabase
        .from('tax_payments')
        .select(`
          id, 
          amount, 
          description,
          project_id,
          projects!inner(id, name, company_id)
        `)
        .eq('projects.company_id', '57bffb9f-78ba-4252-a9ea-10adf83c3155')
        .limit(1);

      if (paymentsError || !payments || payments.length === 0) {
        console.log('❌ No se encontraron pagos para probar');
        return;
      }

      const testPayment = payments[0];
      console.log('Pago de prueba:', testPayment.id, '- Monto:', testPayment.amount);

      // Hacer la llamada a la API
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('❌ No hay sesión activa');
        return;
      }

      console.log('🔧 Haciendo llamada a la API...');
      const response = await fetch(`http://localhost:3000/api/workspace/construction/tax-payments/${testPayment.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Status:', response.status);
      const responseText = await response.text();
      console.log('Respuesta:', responseText);

      if (response.ok) {
        console.log('🎉 ¡Eliminación exitosa!');
      } else {
        console.log('❌ Error en la eliminación');
      }
    }

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

fixMarianoPassword();