import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileType = formData.get('type') as string || 'receipt'

    // Validaciones
    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    // Validar tamaño del archivo (máximo 50MB para recibos)
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'El archivo es demasiado grande. Máximo 50MB.' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo para recibos
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no soportado. Usa JPG, PNG o PDF.' },
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
    const companyId = currentUser.company_id || 'default'
    const fileName = `${companyId}/receipts/${timestamp}_${file.name}`

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('finance-imports')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading receipt:', uploadError)
      return NextResponse.json(
        { error: 'Error al subir el archivo' },
        { status: 500 }
      )
    }

    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('finance-imports')
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      filename: file.name,
      size: file.size
    })

  } catch (error) {
    console.error('Error in POST /api/workspace/finanzas/upload:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}