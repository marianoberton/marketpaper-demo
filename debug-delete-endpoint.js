// =============================================
// DEBUG VERSION - DELETE TAX PAYMENT ENDPOINT
// Versión con logging detallado para identificar el error
// =============================================

export async function DELETE(request, { params }) {
  console.log('🔍 [DEBUG] Iniciando DELETE tax payment...');
  
  try {
    // PASO 1: Obtener usuario actual
    console.log('🔍 [DEBUG] Paso 1: Obteniendo usuario actual...');
    const currentUser = await getCurrentUser();
    console.log('🔍 [DEBUG] Usuario obtenido:', {
      exists: !!currentUser,
      id: currentUser?.id,
      role: currentUser?.role,
      company_id: currentUser?.company_id
    });
    
    if (!currentUser) {
      console.log('❌ [DEBUG] Error: Usuario no autenticado');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // PASO 2: Resolver parámetros
    console.log('🔍 [DEBUG] Paso 2: Resolviendo parámetros...');
    const resolvedParams = await params;
    const paymentId = resolvedParams.id;
    console.log('🔍 [DEBUG] Payment ID:', paymentId);

    // PASO 3: Verificar que el pago existe
    console.log('🔍 [DEBUG] Paso 3: Verificando existencia del pago...');
    const { data: payment, error: paymentError } = await supabase
      .from('tax_payments')
      .select(`
        id,
        project_id,
        projects!inner(company_id)
      `)
      .eq('id', paymentId)
      .single();

    console.log('🔍 [DEBUG] Resultado consulta pago:', {
      payment: payment,
      error: paymentError,
      hasProjects: payment?.projects?.length > 0
    });

    if (paymentError || !payment) {
      console.log('❌ [DEBUG] Error: Pago no encontrado', paymentError);
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    // PASO 4: Verificar permisos
    console.log('🔍 [DEBUG] Paso 4: Verificando permisos...');
    const canDelete = 
      currentUser.role === 'super_admin' ||
      (payment.projects[0].company_id === currentUser.company_id && 
       ['company_owner', 'company_admin', 'manager', 'employee'].includes(currentUser.role));

    console.log('🔍 [DEBUG] Verificación permisos:', {
      isSuperAdmin: currentUser.role === 'super_admin',
      sameCompany: payment.projects[0].company_id === currentUser.company_id,
      allowedRole: ['company_owner', 'company_admin', 'manager', 'employee'].includes(currentUser.role),
      canDelete: canDelete
    });

    if (!canDelete) {
      console.log('❌ [DEBUG] Error: Sin permisos');
      return NextResponse.json({ error: 'Sin permisos para eliminar este pago' }, { status: 403 });
    }

    // PASO 5: Buscar comprobantes
    console.log('🔍 [DEBUG] Paso 5: Buscando comprobantes...');
    const { data: receipts, error: receiptsError } = await supabase
      .from('payment_receipts')
      .select('file_url')
      .eq('tax_payment_id', paymentId);

    console.log('🔍 [DEBUG] Comprobantes encontrados:', {
      count: receipts?.length || 0,
      error: receiptsError,
      receipts: receipts
    });

    // PASO 6: Eliminar comprobantes del storage (si existen)
    if (receipts && receipts.length > 0) {
      console.log('🔍 [DEBUG] Paso 6: Eliminando archivos del storage...');
      for (const receipt of receipts) {
        try {
          const url = new URL(receipt.file_url);
          const pathParts = url.pathname.split('/');
          const bucketIndex = pathParts.findIndex(part => part === 'construction-documents');
          if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
            const filePath = pathParts.slice(bucketIndex + 1).join('/');
            console.log('🔍 [DEBUG] Eliminando archivo:', filePath);
            
            const { error: storageError } = await supabase.storage
              .from('construction-documents')
              .remove([filePath]);
              
            if (storageError) {
              console.log('⚠️ [DEBUG] Error eliminando archivo del storage:', storageError);
            }
          }
        } catch (storageErr) {
          console.log('⚠️ [DEBUG] Error procesando archivo:', storageErr);
        }
      }
    }

    // PASO 7: Eliminar registros de comprobantes
    console.log('🔍 [DEBUG] Paso 7: Eliminando registros de comprobantes...');
    const { error: deleteReceiptsError } = await supabase
      .from('payment_receipts')
      .delete()
      .eq('tax_payment_id', paymentId);

    if (deleteReceiptsError) {
      console.log('⚠️ [DEBUG] Error eliminando comprobantes:', deleteReceiptsError);
    }

    // PASO 8: Eliminar el pago
    console.log('🔍 [DEBUG] Paso 8: Eliminando el pago...');
    const { error: deleteError } = await supabase
      .from('tax_payments')
      .delete()
      .eq('id', paymentId);

    if (deleteError) {
      console.log('❌ [DEBUG] Error eliminando pago:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar el pago' },
        { status: 500 }
      );
    }

    console.log('✅ [DEBUG] Pago eliminado correctamente');
    return NextResponse.json({ 
      message: 'Pago eliminado correctamente' 
    }, { status: 200 });

  } catch (error) {
    console.error('💥 [DEBUG] Error crítico en DELETE:', error);
    console.error('💥 [DEBUG] Stack trace:', error.stack);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}