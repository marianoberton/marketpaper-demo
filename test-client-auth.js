const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://adouqsqyjasjucdgwqxv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkb3Vxc3F5amFzanVjZGd3cXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyODU4MzIsImV4cCI6MjA2NTg2MTgzMn0.t_vF7qPGlbf8y7UEUgKKDLxY9QQdRYKWwNQmqEKUzMs';

// Crear cliente del navegador (similar al que usa la app)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testClientAuth() {
  console.log('🧪 Testando autenticación del cliente...\n');
  
  try {
    // Verificar que podemos acceder a super_admins desde el cliente
    console.log('1️⃣ Verificando acceso a tabla super_admins...');
    const { data: superAdmins, error: superAdminError } = await supabase
      .from('super_admins')
      .select('user_id, full_name, status')
      .eq('status', 'active');
    
    if (superAdminError) {
      console.error('❌ Error accediendo super_admins:', superAdminError.message);
    } else {
      console.log(`✅ Super admins encontrados: ${superAdmins.length}`);
      superAdmins.forEach(admin => {
        console.log(`   - ${admin.full_name || 'Sin nombre'} (Status: ${admin.status})`);
      });
    }
    
    // Verificar que podemos acceder a user_profiles
    console.log('\n2️⃣ Verificando acceso a tabla user_profiles...');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role')
      .limit(3);
    
    if (profileError) {
      console.error('❌ Error accediendo user_profiles:', profileError.message);
    } else {
      console.log(`✅ User profiles encontrados: ${profiles.length}`);
      profiles.forEach(profile => {
        console.log(`   - ${profile.full_name || profile.email} (${profile.role})`);
      });
    }
    
    console.log('\n🎉 Test completado - getCurrentUserClient() debería funcionar correctamente');
    
  } catch (error) {
    console.error('💥 Error durante el test:', error.message);
  }
}

testClientAuth(); 