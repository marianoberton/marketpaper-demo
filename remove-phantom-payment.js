// Script temporal para eliminar el pago fantasma de 2502
// Ejecutar con: node remove-phantom-payment.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://adouqsqyjasjucdgwqxv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkb3Vxc3F5amFzanVjZGd3cXh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI4NTgzMiwiZXhwIjoyMDY1ODYxODMyfQ.AGZMwuvsnEsSM8JN9EcvDXZelaQQ3s5Q5DVrHFEGGCU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function findAndRemovePhantomPayment() {
  try {
    console.log('🔍 Buscando pagos con monto 2502...')
    
    // Buscar pagos con monto 2502
    const { data: payments, error: searchError } = await supabase
      .from('tax_payments')
      .select('*')
      .eq('amount', 2502)
    
    if (searchError) {
      console.error('❌ Error al buscar pagos:', searchError)
      return
    }
    
    console.log(`📊 Encontrados ${payments?.length || 0} pagos con monto 2502`)
    
    if (payments && payments.length > 0) {
      payments.forEach((payment, index) => {
        console.log(`\n💰 Pago ${index + 1}:`)
        console.log(`   ID: ${payment.id}`)
        console.log(`   Proyecto: ${payment.project_id}`)
        console.log(`   Tipo: ${payment.payment_type}`)
        console.log(`   Monto: $${payment.amount}`)
        console.log(`   Fecha: ${payment.payment_date}`)
        console.log(`   Descripción: ${payment.description}`)
        console.log(`   Creado: ${payment.created_at}`)
      })
      
      // Buscar específicamente el que coincide con "Registro CPAU"
      const phantomPayment = payments.find(p => 
        p.description && p.description.toLowerCase().includes('registro') && 
        p.description.toLowerCase().includes('cpau')
      )
      
      if (phantomPayment) {
        console.log('\n🎯 Encontrado el pago fantasma que coincide con "Registro CPAU"')
        console.log(`   ID a eliminar: ${phantomPayment.id}`)
        
        // Eliminar el pago fantasma
        const { error: deleteError } = await supabase
          .from('tax_payments')
          .delete()
          .eq('id', phantomPayment.id)
        
        if (deleteError) {
          console.error('❌ Error al eliminar el pago:', deleteError)
        } else {
          console.log('✅ Pago fantasma eliminado exitosamente')
        }
      } else {
        console.log('\n⚠️  No se encontró un pago que coincida exactamente con "Registro CPAU"')
        console.log('   Puedes revisar manualmente los pagos listados arriba')
      }
    } else {
      console.log('✅ No se encontraron pagos con monto 2502')
    }
    
  } catch (error) {
    console.error('💥 Error general:', error)
  }
}

// Ejecutar el script
findAndRemovePhantomPayment()