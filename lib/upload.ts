import { getSupabaseBrowserClient, getCurrentUser, handleStorageError } from "./supabase-browser";

// Utilidades para nombres de archivos
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9.\-]+/g, "-").replace(/^-+|-+$/g, "");

const sanitizeFileName = (fileName: string): string => {
  const parts = fileName.split('.');
  const extension = parts.pop() || '';
  const name = parts.join('.');
  return `${slug(name)}.${extension}`;
};

// Generar path único para el archivo
async function buildPath(file: File, customPath?: string): Promise<string> {
  const { user } = await getCurrentUser();
  const uid = user?.id ?? "anon";
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const sanitizedName = sanitizeFileName(file.name);
  
  if (customPath) {
    return `${customPath}/${timestamp}-${randomId}-${sanitizedName}`;
  }
  
  return `users/${uid}/${timestamp}-${randomId}-${sanitizedName}`;
}

// Validar archivo antes del upload
function validateFile(file: File): { isValid: boolean; error?: string } {
  // Validar que sea un archivo válido
  if (!file || !(file instanceof File)) {
    return { isValid: false, error: "Archivo inválido" };
  }
  
  // Validar nombre del archivo
  if (!file.name || file.name.trim() === '') {
    return { isValid: false, error: "El archivo debe tener un nombre" };
  }
  
  // Validar tamaño mínimo
  if (file.size === 0) {
    return { isValid: false, error: "El archivo está vacío" };
  }
  
  // Validar tamaño máximo general (500MB)
  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    return { isValid: false, error: "El archivo es demasiado grande (máximo 500MB)" };
  }
  
  return { isValid: true };
}

// Interfaz para parámetros de upload
export interface UploadParams {
  file: File;
  bucket: string;
  path?: string;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

// Interfaz para resultado de upload
export interface UploadResult {
  bucket: string;
  path: string;
  publicUrl: string;
  data: any;
}

// Función principal de upload con URL firmada
export async function uploadWithSignedUrl(params: UploadParams): Promise<UploadResult> {
  const { file, bucket, path: customPath, onProgress, signal } = params;
  
  // Validar archivo
  const validation = validateFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error!);
  }
  
  if (!bucket) {
    throw new Error("Bucket es requerido");
  }
  
  // Verificar si la operación fue cancelada
  if (signal?.aborted) {
    throw new Error("Upload cancelado");
  }
  
  try {
    // Generar path único
    const filePath = customPath || await buildPath(file);
    
    // Reportar progreso inicial
    onProgress?.(0);
    
    // Solicitar URL firmada
    const response = await fetch("/api/storage/create-upload-url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ 
        bucket, 
        path: filePath,
        fileSize: file.size,
        mimeType: file.type
      }),
      signal
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error HTTP ${response.status}: ${response.statusText}`);
    }
    
    const { signedUrl, token, path: returnedPath } = await response.json();
    
    if (!signedUrl || !token) {
      throw new Error("Respuesta inválida del servidor: faltan signedUrl o token");
    }
    
    // Reportar progreso
    onProgress?.(25);
    
    // Verificar si la operación fue cancelada
    if (signal?.aborted) {
      throw new Error("Upload cancelado");
    }
    
    // Subir archivo usando la URL firmada
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .uploadToSignedUrl(returnedPath, token, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw new Error(handleStorageError(error));
    }
    
    // Reportar progreso
    onProgress?.(75);
    
    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(returnedPath);
    
    // Reportar progreso completado
    onProgress?.(100);
    
    return {
      bucket,
      path: returnedPath,
      publicUrl,
      data
    };
    
  } catch (error: any) {
    // Si es un error de cancelación, re-lanzarlo tal como está
    if (error.name === 'AbortError' || error.message.includes('cancelado')) {
      throw error;
    }
    
    // Para otros errores, proporcionar contexto adicional
    const errorMessage = error.message || 'Error desconocido durante el upload';
    console.error('Upload error:', {
      error,
      file: { name: file.name, size: file.size, type: file.type },
      bucket,
      customPath
    });
    
    throw new Error(`Error al subir archivo: ${errorMessage}`);
  }
}

// Función para cancelar upload (para uso futuro con AbortController)
export function createUploadController(): AbortController {
  return new AbortController();
}

// Función para validar bucket
export function isValidBucket(bucket: string): boolean {
  const validBuckets = ['finance-imports', 'construction-documents', 'company-logos', 'docs'];
  return validBuckets.includes(bucket);
}

// Función para obtener configuración de bucket
export function getBucketConfig(bucket: string) {
  const configs = {
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
  };
  
  return configs[bucket as keyof typeof configs];
}