import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    // Verificar autenticación
    const supabase = createServerComponentClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Validaciones de seguridad
        const maxSize = 50 * 1024 * 1024; // 50MB
        
        if (clientPayload && typeof clientPayload === 'object' && 'size' in clientPayload) {
          const fileSize = clientPayload.size as number;
          if (fileSize > maxSize) {
            throw new Error('El archivo excede el límite de 50MB');
          }
        }

        // Validar tipos de archivo permitidos
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
          'image/jpg',
          'application/vnd.dwg', // Para archivos DWG
          'image/vnd.dwg'
        ];

        if (clientPayload && typeof clientPayload === 'object' && 'type' in clientPayload) {
          const fileType = clientPayload.type as string;
          if (!allowedTypes.includes(fileType)) {
            throw new Error('Tipo de archivo no permitido');
          }
        }

        return {
          allowedContentTypes: allowedTypes,
          tokenPayload: JSON.stringify({
            userId: user.id,
            uploadedAt: new Date().toISOString(),
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Aquí puedes guardar la información del archivo en tu base de datos
        console.log('Archivo subido exitosamente:', {
          url: blob.url,
          pathname: blob.pathname,
          size: blob.size,
          tokenPayload,
        });
        
        // Opcional: Guardar en Supabase para tracking
        try {
          await supabase.from('file_uploads').insert({
            user_id: user.id,
            file_url: blob.url,
            file_name: blob.pathname,
            file_size: blob.size,
            upload_method: 'vercel_blob'
          });
        } catch (error) {
          console.error('Error guardando información del archivo:', error);
          // No fallar la subida por esto
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Error en upload de blob:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 400 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 30;