const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Leer variables de entorno manualmente
let supabaseUrl, supabaseServiceKey

try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8')
  const envLines = envContent.split('\n')
  
  for (const line of envLines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim()
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseServiceKey = line.split('=')[1].trim()
    }
  }
} catch (error) {
  console.error('Error leyendo .env.local:', error.message)
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testExpedientes() {
  console.log('🔍 Probando acceso directo a project_expedientes...')
  
  try {
    // 1. Verificar si la tabla existe
    console.log('\n1. Verificando estructura de la tabla...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('project_expedientes')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Error accediendo a la tabla:', tableError)
      return
    }
    
    console.log('✅ Tabla accesible')
    
    // 2. Contar total de expedientes
    console.log('\n2. Contando expedientes...')
    const { count, error: countError } = await supabase
      .from('project_expedientes')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Error contando expedientes:', countError)
    } else {
      console.log(`📊 Total de expedientes: ${count}`)
    }
    
    // 3. Obtener algunos expedientes de ejemplo
    console.log('\n3. Obteniendo expedientes de ejemplo...')
    const { data: expedientes, error: expedientesError } = await supabase
      .from('project_expedientes')
      .select('*')
      .limit(5)
    
    if (expedientesError) {
      console.error('❌ Error obteniendo expedientes:', expedientesError)
    } else {
      console.log(`📋 Expedientes encontrados: ${expedientes.length}`)
      if (expedientes.length > 0) {
        console.log('Primer expediente:', JSON.stringify(expedientes[0], null, 2))
      }
    }
    
    // 4. Probar consulta con JOIN como en la API
    console.log('\n4. Probando consulta con JOIN (como en la API)...')
    const { data: projects, error: joinError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        expedientes:project_expedientes(*)
      `)
      .limit(1)
    
    if (joinError) {
      console.error('❌ Error en consulta con JOIN:', joinError)
    } else {
      console.log('✅ Consulta con JOIN exitosa')
      if (projects && projects.length > 0) {
        console.log('Proyecto con expedientes:', JSON.stringify(projects[0], null, 2))
      }
    }
    
    // 5. Verificar políticas RLS
    console.log('\n5. Verificando políticas RLS...')
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'project_expedientes')
    
    if (policiesError) {
      console.error('❌ Error obteniendo políticas RLS:', policiesError)
    } else {
      console.log(`🔒 Políticas RLS encontradas: ${policies.length}`)
      policies.forEach(policy => {
        console.log(`- ${policy.policyname}: ${policy.cmd} - ${policy.qual}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

testExpedientes()