import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth-server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 DELETE Payment - Iniciando...')
    
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      console.log('❌ Usuario no autenticado')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('✅ Usuario autenticado:', { id: currentUser.id, role: currentUser.role })

    const resolvedParams = await params
    const paymentId = resolvedParams.id
    console.log('🔍 Payment ID:', paymentId)

    // Verificar que el pago existe - consulta más simple primero
    const { data: payment, error: paymentError } = await supabase
      .from('tax_payments')
      .select('id, project_id')
      .eq('id', paymentId)
      .single()

    console.log('🔍 Payment query result:', { payment, paymentError })

    if (paymentError || !payment) {
      console.log('❌ Payment not found:', paymentError)
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    // Obtener información del proyecto por separado
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, company_id')
      .eq('id', payment.project_id)
      .single()

    console.log('🔍 Project query result:', { project, projectError })

    if (projectError || !project) {
      console.log('❌ Project not found:', projectError)
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Verificar permisos de eliminación
    const canDelete = 
      // Super admin puede eliminar cualquier pago
      currentUser.role === 'super_admin' ||
      // Usuarios de la misma empresa pueden eliminar (excepto viewers)
      (project.company_id === currentUser.company_id && 
       ['company_owner', 'company_admin', 'manager', 'employee'].includes(currentUser.role))

    console.log('🔍 Permission check:', {
      isSuperAdmin: currentUser.role === 'super_admin',
      sameCompany: project.company_id === currentUser.company_id,
      allowedRole: ['company_owner', 'company_admin', 'manager', 'employee'].includes(currentUser.role),
      canDelete
    })

    if (!canDelete) {
      console.log('❌ Permission denied')
      return NextResponse.json({ error: 'Sin permisos para eliminar este pago' }, { status: 403 })
    }

    // Eliminar comprobantes asociados del storage
    console.log('🔍 Buscando comprobantes...')
    const { data: receipts, error: receiptsError } = await supabase
      .from('payment_receipts')
      .select('file_url')
      .eq('tax_payment_id', paymentId)

    console.log('🔍 Receipts found:', { count: receipts?.length || 0, error: receiptsError })

    if (receipts && receipts.length > 0) {
      console.log('🔍 Eliminando archivos del storage...')
      for (const receipt of receipts) {
        try {
          // Extraer el path del archivo de la URL
          const url = new URL(receipt.file_url)
          const pathParts = url.pathname.split('/')
          const bucketIndex = pathParts.findIndex(part => part === 'construction-documents')
          if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
            const filePath = pathParts.slice(bucketIndex + 1).join('/')
            
            console.log('🔍 Eliminando archivo:', filePath)
            // Eliminar archivo del storage
            const { error: storageError } = await supabase.storage
              .from('construction-documents')
              .remove([filePath])
              
            if (storageError) {
              console.log('⚠️ Error eliminando archivo del storage:', storageError)
            }
          }
        } catch (storageErr) {
          console.log('⚠️ Error procesando archivo:', storageErr)
        }
      }
    }

    // Eliminar registros de comprobantes
    console.log('🔍 Eliminando registros de comprobantes...')
    const { error: deleteReceiptsError } = await supabase
      .from('payment_receipts')
      .delete()
      .eq('tax_payment_id', paymentId)

    if (deleteReceiptsError) {
      console.log('⚠️ Error eliminando comprobantes:', deleteReceiptsError)
    }

    // Eliminar el pago
    console.log('🔍 Eliminando el pago...')
    const { error: deleteError } = await supabase
      .from('tax_payments')
      .delete()
      .eq('id', paymentId)

    if (deleteError) {
      console.error('❌ Database error:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar el pago' },
        { status: 500 }
      )
    }

    console.log('✅ Pago eliminado correctamente')
    return NextResponse.json({ 
      message: 'Pago eliminado correctamente' 
    }, { status: 200 })

  } catch (error) {
    console.error('💥 Error deleting payment:', error)
    console.error('💥 Stack trace:', error instanceof Error ? error.stack : 'No stack trace available')
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}