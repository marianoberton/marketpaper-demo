// Script para probar las claves de autenticación de Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('=== TESTING SUPABASE AUTH KEYS ===\n');

// Mostrar las variables de entorno que se están usando
console.log('Environment variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : 'NOT SET');
console.log('');

// Probar conexión con las claves actuales
async function testConnection() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log('Testing connection with current keys...');
    
    // Intentar una operación simple
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      console.error('Error details:', error);
    } else {
      console.log('✅ Connection successful!');
      console.log('Response:', data);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

// Probar autenticación con credenciales de prueba
async function testAuth() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log('\nTesting authentication...');
    
    // Intentar login con credenciales de prueba (esto fallará pero nos dará info)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword'
    });
    
    if (error) {
      if (error.message.includes('Invalid API key')) {
        console.error('❌ Invalid API key - Las claves no son válidas');
      } else if (error.message.includes('Invalid login credentials')) {
        console.log('✅ API key is valid (credentials are just wrong, which is expected)');
      } else {
        console.error('❌ Auth error:', error.message);
      }
    } else {
      console.log('✅ Unexpected success (shouldn\'t happen with test credentials)');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

// Ejecutar las pruebas
testConnection().then(() => testAuth());