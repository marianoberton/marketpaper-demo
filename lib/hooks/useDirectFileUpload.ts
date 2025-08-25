import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UploadOptions {
  bucket: string;
  path: string;
  file: File;
}

interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

export function useDirectFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async ({ bucket, path, file }: UploadOptions): Promise<UploadResult> => {
    setIsUploading(true);
    setProgress(0);

    try {
      // Paso 1: Obtener URL firmada del nuevo endpoint
      const response = await fetch('/api/storage/create-upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bucket, path }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error obteniendo URL firmada');
      }

      const { signedUrl, token } = await response.json();
      setProgress(25);

      // Paso 2: Subir archivo directamente a Supabase usando la URL firmada
      const { data, error } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(path, token, file, {
          contentType: file.type,
          upsert: false
        });

      if (error) {
        throw new Error(`Error subiendo archivo: ${error.message}`);
      }

      setProgress(75);

      // Paso 3: Obtener URL pública si el bucket es público
      let publicUrl: string | undefined;
      const publicBuckets = ['company-logos'];
      
      if (publicBuckets.includes(bucket)) {
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(path);
        publicUrl = urlData.publicUrl;
      }

      setProgress(100);

      return {
        success: true,
        publicUrl,
      };
    } catch (error) {
      console.error('Error en subida directa:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return {
    uploadFile,
    isUploading,
    progress,
  };
}