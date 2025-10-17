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
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const resolvedParams = await params
    const paymentId = resolvedParams.id

    // Verificar que el pago existe y pertenece a la empresa del usuario
    const { data: payment, error: paymentError } = await supabase
      .from('tax_payments')
      .select(`
        id,
        project_id,
        projects!inner(company_id)
      `)
      .eq('id', paymentId)
      .single()

    console.log('DELETE Payment Debug:', {
      paymentId,
      payment,
      paymentError,
      currentUser: {
        id: currentUser.id,
        company_id: currentUser.company_id,
        role: currentUser.role
      }
    })

    if (paymentError || !payment) {
      console.log('Payment not found:', paymentError)
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    // Permitir eliminación si es super_admin o si pertenece a la misma empresa
    if (currentUser.role !== 'super_admin' && payment.projects[0].company_id !== currentUser.company_id) {
      console.log('Permission denied:', {
        paymentCompanyId: payment.projects[0].company_id,
        userCompanyId: currentUser.company_id,
        userRole: currentUser.role
      })
      return NextResponse.json({ error: 'Sin permisos para eliminar este pago' }, { status: 403 })
    }

    // Eliminar comprobantes asociados del storage
    const { data: receipts } = await supabase
      .from('payment_receipts')
      .select('file_url')
      .eq('tax_payment_id', paymentId)

    if (receipts && receipts.length > 0) {
      for (const receipt of receipts) {
        // Extraer el path del archivo de la URL
        const url = new URL(receipt.file_url)
        const pathParts = url.pathname.split('/')
        const bucketIndex = pathParts.findIndex(part => part === 'construction-documents')
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          const filePath = pathParts.slice(bucketIndex + 1).join('/')
          
          // Eliminar archivo del storage
          await supabase.storage
            .from('construction-documents')
            .remove([filePath])
        }
      }
    }

    // Eliminar registros de comprobantes
    await supabase
      .from('payment_receipts')
      .delete()
      .eq('tax_payment_id', paymentId)

    // Eliminar el pago
    const { error: deleteError } = await supabase
      .from('tax_payments')
      .delete()
      .eq('id', paymentId)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar el pago' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Pago eliminado correctamente' 
    }, { status: 200 })

  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}