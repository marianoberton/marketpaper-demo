const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAPIAuth() {
  console.log('=== Debuggeando autenticación en la API ===\n');

  try {
    // 1. Verificar que el usuario mariano existe en user_profiles
    const { data: marianoUser, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'mariano@mariano.com')
      .single();

    if (userError || !marianoUser) {
      console.error('❌ Usuario mariano no encontrado en user_profiles:', userError);
      return;
    }

    console.log('✅ Usuario encontrado en user_profiles:');
    console.log('- ID:', marianoUser.id);
    console.log('- Email:', marianoUser.email);
    console.log('- Role:', marianoUser.role);
    console.log('- Company ID:', marianoUser.company_id);
    console.log();

    // 2. Verificar si existe en auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error listando usuarios de auth:', authError);
      return;
    }

    const authUser = authUsers.users.find(u => u.email === 'mariano@mariano.com');
    
    if (!authUser) {
      console.log('❌ Usuario mariano NO existe en auth.users');
      console.log('Esto explica por qué no puede autenticarse');
      
      // Crear el usuario en auth
      console.log('\n🔧 Creando usuario en auth.users...');
      const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'mariano@mariano.com',
        password: 'password123',
        email_confirm: true,
        user_metadata: {
          full_name: marianoUser.full_name
        }
      });

      if (createError) {
        console.error('❌ Error creando usuario en auth:', createError);
        return;
      }

      console.log('✅ Usuario creado en auth.users:', newAuthUser.user.id);
      
      // Actualizar el user_profiles con el ID correcto
      if (newAuthUser.user.id !== marianoUser.id) {
        console.log('🔧 Actualizando ID en user_profiles...');
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ id: newAuthUser.user.id })
          .eq('email', 'mariano@mariano.com');

        if (updateError) {
          console.error('❌ Error actualizando user_profiles:', updateError);
        } else {
          console.log('✅ user_profiles actualizado con nuevo ID');
        }
      }
    } else {
      console.log('✅ Usuario existe en auth.users:');
      console.log('- Auth ID:', authUser.id);
      console.log('- Profile ID:', marianoUser.id);
      
      if (authUser.id !== marianoUser.id) {
        console.log('⚠️  IDs no coinciden - esto puede causar problemas');
        
        // Actualizar user_profiles con el ID correcto
        console.log('🔧 Sincronizando IDs...');
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ id: authUser.id })
          .eq('email', 'mariano@mariano.com');

        if (updateError) {
          console.error('❌ Error sincronizando IDs:', updateError);
        } else {
          console.log('✅ IDs sincronizados correctamente');
        }
      }
    }

    // 3. Probar login después de las correcciones
    console.log('\n=== Probando login después de correcciones ===');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'mariano@mariano.com',
      password: 'password123'
    });

    if (loginError) {
      console.error('❌ Error en login:', loginError);
    } else {
      console.log('✅ Login exitoso');
      console.log('- User ID:', loginData.user.id);
      console.log('- Email:', loginData.user.email);
    }

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

debugAPIAuth();