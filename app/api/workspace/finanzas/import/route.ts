import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileType = formData.get('file_type') as string
    const company_id = formData.get('company_id') as string

    // Validaciones
    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    if (!fileType) {
      return NextResponse.json(
        { error: 'Tipo de archivo es requerido' },
        { status: 400 }
      )
    }

    if (!company_id) {
      return NextResponse.json(
        { error: 'ID de empresa es requerido' },
        { status: 400 }
      )
    }

    // Validar tamaño del archivo (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 10MB.' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    const allowedTypes = {
      'credit_card': ['.pdf', '.xlsx', '.xls', '.csv'],
      'bank_statement': ['.pdf', '.xlsx', '.xls', '.csv'],
      'receipt': ['.jpg', '.jpeg', '.png', '.pdf'],
      'other': ['.pdf', '.xlsx', '.xls', '.csv', '.txt']
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = allowedTypes[fileType as keyof typeof allowedTypes] || []

    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Tipo de archivo no soportado para ${fileType}` },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Obtener usuario actual
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Convertir archivo a buffer para almacenamiento
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const fileName = `${company_id}/${fileType}/${timestamp}_${file.name}`

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('finance-imports')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json(
        { error: 'Error al subir el archivo' },
        { status: 500 }
      )
    }

    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('finance-imports')
      .getPublicUrl(fileName)

    // Guardar registro del archivo importado
    const importRecord = {
      company_id,
      filename: file.name,
      file_url: urlData.publicUrl,
      file_type: fileType,
      processing_status: 'pending',
      extracted_expenses: 0,
      uploaded_by: currentUser.id
    }

    const { data: savedImport, error: saveError } = await supabase
      .from('imported_files')
      .insert(importRecord)
      .select('*')
      .single()

    if (saveError) {
      console.error('Error saving import record:', saveError)
      // Intentar eliminar el archivo subido
      await supabase.storage
        .from('finance-imports')
        .remove([fileName])
      
      return NextResponse.json(
        { error: 'Error al guardar el registro de importación' },
        { status: 500 }
      )
    }

    // Procesar el archivo de manera asíncrona
    processFileAsync(savedImport.id, fileName, fileType, company_id)

    return NextResponse.json({
      success: true,
      file: savedImport,
      message: 'Archivo subido correctamente. El procesamiento iniciará en breve.'
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/workspace/finanzas/import:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const company_id = searchParams.get('company_id')
    const processing_status = searchParams.get('processing_status')
    const file_type = searchParams.get('file_type')
    const limit = searchParams.get('limit') || '50'
    const offset = searchParams.get('offset') || '0'

    const supabase = await createClient()

    // Construir la query base
    let query = supabase
      .from('imported_files')
      .select('*')
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

    // Filtros
    if (company_id) {
      query = query.eq('company_id', company_id)
    }

    if (processing_status) {
      query = query.eq('processing_status', processing_status)
    }

    if (file_type) {
      query = query.eq('file_type', file_type)
    }

    const { data: files, error } = await query

    if (error) {
      console.error('Error fetching imported files:', error)
      return NextResponse.json(
        { error: 'Error al obtener los archivos importados' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      files: files || []
    })

  } catch (error) {
    console.error('Error in GET /api/workspace/finanzas/import:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función para procesar archivos de manera asíncrona
async function processFileAsync(importId: string, fileName: string, fileType: string, companyId: string) {
  try {
    const supabase = await createClient()

    // Actualizar estado a "procesando"
    await supabase
      .from('imported_files')
      .update({ processing_status: 'processing' })
      .eq('id', importId)

    // Simular procesamiento (en una implementación real, aquí iría la lógica de OCR/IA)
    await new Promise(resolve => setTimeout(resolve, 2000))

    let extractedExpenses: any[] = []

    // Lógica de procesamiento según el tipo de archivo
    switch (fileType) {
      case 'credit_card':
        extractedExpenses = await processCreditCardFile(fileName, companyId)
        break
      case 'bank_statement':
        extractedExpenses = await processBankStatementFile(fileName, companyId)
        break
      case 'receipt':
        extractedExpenses = await processReceiptFile(fileName, companyId)
        break
      default:
        extractedExpenses = await processGenericFile(fileName, companyId)
    }

    // Obtener categorías para clasificación automática
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)

    // Categorizar automáticamente los gastos
    const categorizedExpenses = await categorizarGastosAutomaticamente(extractedExpenses, categories || [])

    // Insertar gastos extraídos
    if (categorizedExpenses.length > 0) {
      const { error: insertError } = await supabase
        .from('expenses')
        .insert(categorizedExpenses)

      if (insertError) {
        console.error('Error inserting extracted expenses:', insertError)
        throw new Error('Error al insertar gastos extraídos')
      }
    }

    // Actualizar el estado del archivo a completado
    await supabase
      .from('imported_files')
      .update({
        processing_status: 'completed',
        extracted_expenses: categorizedExpenses.length
      })
      .eq('id', importId)

  } catch (error) {
    console.error('Error processing file:', error)
    
    // Actualizar estado a fallido
    const supabase = await createClient()
    await supabase
      .from('imported_files')
      .update({ processing_status: 'failed' })
      .eq('id', importId)
  }
}

// Función mock para procesar archivos de tarjeta de crédito
async function processCreditCardFile(fileName: string, companyId: string): Promise<any[]> {
  // En una implementación real, aquí se procesaría el PDF/Excel con OCR/parsing
  // Por ahora, retornamos datos de ejemplo
  return [
    {
      company_id: companyId,
      amount: 2500.00,
      description: 'MERCADOLIBRE MERCADOPAGO',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'credit_card',
      notes: `Extraído automáticamente de ${fileName}`,
      tags: ['importado', 'tarjeta'],
      is_recurring: false
    },
    {
      company_id: companyId,
      amount: 1250.50,
      description: 'SHELL ESTACION DE SERVICIO',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      payment_method: 'credit_card',
      notes: `Extraído automáticamente de ${fileName}`,
      tags: ['importado', 'tarjeta'],
      is_recurring: false
    }
  ]
}

// Función mock para procesar extractos bancarios
async function processBankStatementFile(fileName: string, companyId: string): Promise<any[]> {
  return [
    {
      company_id: companyId,
      amount: 3200.00,
      description: 'TRANSFERENCIA BANCARIA',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'bank_transfer',
      notes: `Extraído automáticamente de ${fileName}`,
      tags: ['importado', 'banco'],
      is_recurring: false
    }
  ]
}

// Función mock para procesar recibos
async function processReceiptFile(fileName: string, companyId: string): Promise<any[]> {
  return [
    {
      company_id: companyId,
      amount: 850.00,
      description: 'COMPRA EN SUPERMERCADO',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      notes: `Extraído automáticamente de ${fileName}`,
      tags: ['importado', 'recibo'],
      is_recurring: false
    }
  ]
}

// Función mock para procesar archivos genéricos
async function processGenericFile(fileName: string, companyId: string): Promise<any[]> {
  return [
    {
      company_id: companyId,
      amount: 1500.00,
      description: 'GASTO VARIOS',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'other',
      notes: `Extraído automáticamente de ${fileName}`,
      tags: ['importado', 'otros'],
      is_recurring: false
    }
  ]
}

// Función para categorización automática
async function categorizarGastosAutomaticamente(gastos: any[], categorias: any[]): Promise<any[]> {
  const palabrasClave: Record<string, string[]> = {
    'Alimentación': ['mercado', 'super', 'restaurant', 'comida', 'delivery', 'mcdonalds', 'burger'],
    'Transporte': ['shell', 'ypf', 'axion', 'uber', 'taxi', 'combustible', 'nafta'],
    'Entretenimiento': ['cinema', 'spotify', 'netflix', 'teatro', 'cine'],
    'Salud': ['farmacia', 'medico', 'hospital', 'clinica', 'osde'],
    'Servicios': ['edenor', 'metrogas', 'telecom', 'movistar', 'internet'],
    'Compras': ['mercadolibre', 'tienda', 'ropa', 'amazon']
  }

  return gastos.map(gasto => {
    const descripcionLower = gasto.description.toLowerCase()
    
    // Buscar categoría que coincida
    let categoriaEncontrada = categorias.find(cat => cat.name === 'Otros') // Por defecto
    
    for (const [nombreCategoria, palabras] of Object.entries(palabrasClave)) {
      if (palabras.some(palabra => descripcionLower.includes(palabra))) {
        const categoria = categorias.find(cat => cat.name === nombreCategoria)
        if (categoria) {
          categoriaEncontrada = categoria
          break
        }
      }
    }

    return {
      ...gasto,
      category_id: categoriaEncontrada?.id,
      category_name: categoriaEncontrada?.name
    }
  })
} 