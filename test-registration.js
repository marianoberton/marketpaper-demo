const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase (usando las variables de entorno)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔧 Configuración de Supabase:')
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante')
console.log('Key:', supabaseAnonKey ? '✅ Configurada' : '❌ Faltante')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('\n🔍 Probando conexión a Supabase...')
    
    // Test básico de conexión
    const { data, error } = await supabase
      .from('registration_requests')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Error en conexión básica:', error)
      return false
    }
    
    console.log('✅ Conexión exitosa. Registros existentes:', data)
    return true
    
  } catch (error) {
    console.error('❌ Error de conexión:', error)
    return false
  }
}

async function testInsert() {
  try {
    console.log('\n📝 Probando inserción...')
    
    const testData = {
      full_name: 'Test User',
      email: 'test@example.com',
      company_name: 'Test Company',
      phone: '+1234567890',
      status: 'pending',
      requested_at: new Date().toISOString(),
      metadata: {
        test: true,
        user_agent: 'test-script'
      }
    }
    
    console.log('Datos a insertar:', testData)
    
    const { data, error } = await supabase
      .from('registration_requests')
      .insert(testData)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error en inserción:', {
        error: error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return false
    }
    
    console.log('✅ Inserción exitosa:', data)
    return true
    
  } catch (error) {
    console.error('❌ Error de inserción:', error)
    return false
  }
}

async function testTableExists() {
  try {
    console.log('\n🔍 Verificando que la tabla registration_requests existe...')
    
    const { data, error } = await supabase
      .rpc('get_table_info', { table_name: 'registration_requests' })
    
    if (error) {
      console.log('⚠️  No se pudo verificar con RPC, intentando SELECT directo...')
      
      // Intentar un SELECT simple
      const { data: selectData, error: selectError } = await supabase
        .from('registration_requests')
        .select('id')
        .limit(1)
      
      if (selectError) {
        console.error('❌ Error verificando tabla:', selectError)
        return false
      }
      
      console.log('✅ Tabla existe y es accesible')
      return true
    }
    
    console.log('✅ Información de tabla:', data)
    return true
    
  } catch (error) {
    console.error('❌ Error verificando tabla:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Iniciando pruebas de Supabase para registration_requests\n')
  
  const connectionOk = await testConnection()
  if (!connectionOk) {
    console.log('\n❌ Falló la conexión básica')
    return
  }
  
  const tableOk = await testTableExists()
  if (!tableOk) {
    console.log('\n❌ Problema con la tabla registration_requests')
    return
  }
  
  const insertOk = await testInsert()
  if (!insertOk) {
    console.log('\n❌ Falló la inserción')
    return
  }
  
  console.log('\n✅ Todas las pruebas pasaron! La configuración de Supabase está correcta.')
}

main().catch(console.error) 