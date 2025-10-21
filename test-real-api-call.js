const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealAPICall() {
  console.log('=== Probando llamada real a la API de eliminación ===\n');

  try {
    // 1. Buscar el usuario mariano@mariano.com
    const { data: marianoUser, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, role, company_id, full_name')
      .eq('email', 'mariano@mariano.com')
      .single();

    if (userError || !marianoUser) {
      console.error('Error buscando usuario mariano:', userError);
      return;
    }

    console.log('Usuario encontrado:', marianoUser.email, '- Role:', marianoUser.role);

    // 2. Buscar un pago de su empresa
    const { data: payments, error: paymentsError } = await supabase
      .from('tax_payments')
      .select(`
        id, 
        amount, 
        description,
        project_id,
        projects!inner(id, name, company_id)
      `)
      .eq('projects.company_id', marianoUser.company_id)
      .limit(1);

    if (paymentsError || !payments || payments.length === 0) {
      console.error('Error buscando pagos:', paymentsError);
      return;
    }

    const testPayment = payments[0];
    console.log('Pago de prueba:', testPayment.id, '- Monto:', testPayment.amount);
    console.log('Proyecto:', testPayment.projects.name, '- Company:', testPayment.projects.company_id);

    // 3. Simular la llamada a la API usando fetch (como lo haría el frontend)
    console.log('\n=== Simulando llamada del frontend ===');
    
    // Primero necesitamos crear una sesión de usuario para mariano
    // Esto es lo que normalmente haría el login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mariano@mariano.com',
      password: 'password123' // Asumiendo que esta es la contraseña
    });

    if (authError) {
      console.error('Error de autenticación:', authError);
      console.log('Intentando crear el usuario primero...');
      
      // Si no existe, crearlo
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'mariano@mariano.com',
        password: 'password123'
      });
      
      if (signUpError) {
        console.error('Error creando usuario:', signUpError);
        return;
      }
      
      console.log('Usuario creado, intentando login nuevamente...');
      const { data: retryAuth, error: retryError } = await supabase.auth.signInWithPassword({
        email: 'mariano@mariano.com',
        password: 'password123'
      });
      
      if (retryError) {
        console.error('Error en segundo intento de login:', retryError);
        return;
      }
    }

    console.log('✅ Usuario autenticado correctamente');

    // 4. Ahora hacer la llamada real a la API
    const apiUrl = `http://localhost:3000/api/workspace/construction/tax-payments/${testPayment.id}`;
    console.log('Llamando a:', apiUrl);

    // Obtener el token de sesión
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No hay sesión activa');
      return;
    }

    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status de respuesta:', response.status);
    
    const responseData = await response.text();
    console.log('Respuesta:', responseData);

    if (!response.ok) {
      console.log('❌ Error en la API:', responseData);
    } else {
      console.log('✅ Eliminación exitosa');
    }

  } catch (error) {
    console.error('Error en la prueba:', error);
  }
}

testRealAPICall();