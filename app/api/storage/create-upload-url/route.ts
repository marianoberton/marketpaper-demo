import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth-server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ server-only
);

// Configuración de buckets y límites
const BUCKET_CONFIG = {
  'finance-imports': {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']
  },
  'construction-documents': {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  'company-logos': {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  },
  'docs': {
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  }
} as const;

type BucketName = keyof typeof BUCKET_CONFIG;

export async function POST(req: Request) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' }, 
        { status: 401 }
      );
    }

    const { bucket, path, fileSize, mimeType } = await req.json();
    
    // Validar campos requeridos
    const missing = ["bucket", "path"].filter(k => !({bucket, path} as any)[k]);
    if (missing.length) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: " + missing.join(", ") }, 
        { status: 400 }
      );
    }

    // Validar bucket permitido
    if (!(bucket in BUCKET_CONFIG)) {
      return NextResponse.json(
        { error: `Bucket no permitido: ${bucket}. Buckets disponibles: ${Object.keys(BUCKET_CONFIG).join(', ')}` }, 
        { status: 400 }
      );
    }

    const bucketConfig = BUCKET_CONFIG[bucket as BucketName];

    // Validar tamaño del archivo
    if (fileSize && fileSize > bucketConfig.maxSize) {
      const maxSizeMB = Math.round(bucketConfig.maxSize / (1024 * 1024));
      return NextResponse.json(
        { error: `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (mimeType) {
      const isAllowed = bucketConfig.allowedTypes.some(allowedType => {
        if (allowedType.endsWith('/*')) {
          return mimeType.startsWith(allowedType.replace('/*', '/'));
        }
        return mimeType === allowedType;
      });

      if (!isAllowed) {
        return NextResponse.json(
          { error: `Tipo de archivo no permitido: ${mimeType}. Tipos permitidos: ${bucketConfig.allowedTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validar formato del path
    if (path.includes('..') || path.startsWith('/')) {
      return NextResponse.json(
        { error: 'Path inválido' },
        { status: 400 }
      );
    }
    
    // Crear URL firmada
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(path, {
        upsert: false // Evitar sobrescribir archivos existentes
      });
      
    if (error) {
      console.error('Error creating signed URL:', error);
      return NextResponse.json(
        { error: `Error al crear URL firmada: ${error.message}` }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      bucket,
      expiresIn: 3600 // 1 hora
    });
    
  } catch (e: any) {
    console.error('Unexpected error in create-upload-url:', e);
    return NextResponse.json(
      { error: e?.message ?? "Error interno del servidor" }, 
      { status: 500 }
    );
  }
}