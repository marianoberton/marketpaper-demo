import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'

/**
 * @deprecated Este endpoint está obsoleto. 
 * Usar el nuevo sistema de upload con URLs firmadas:
 * 1. POST /api/storage/create-upload-url para obtener URL firmada
 * 2. Upload directo a Supabase Storage desde el cliente
 * 3. Guardar metadatos usando los endpoints específicos de cada módulo
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Este endpoint está obsoleto. Usar el nuevo sistema de upload con URLs firmadas.',
      migration_guide: {
        step1: 'POST /api/storage/create-upload-url para obtener URL firmada',
        step2: 'Upload directo a Supabase Storage desde el cliente',
        step3: 'Guardar metadatos usando endpoints específicos'
      }
    },
    { status: 410 } // Gone
  )
}