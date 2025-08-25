'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { sanitizeFileName, generateUniqueFileName, validateFileType, validateFileSize } from '@/lib/files';
import type { AllowedBucket, SignedUploadResponse, CommitUploadResponse } from '@/types/storage';

interface UploadOptions {
  bucket: AllowedBucket;
  workspaceId: string;
  file: File;
  folder?: string;
}

interface UploadResult {
  bucket: AllowedBucket;
  path: string;
  publicUrl?: string;
}

interface UploadProgress {
  isUploading: boolean;
  progress: number;
  fileName?: string;
}

const DEFAULT_ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/vnd.dwg',
  'image/vnd.dwg'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Create Supabase client for direct uploads
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

export function useFileUpload() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    isUploading: false,
    progress: 0
  });

  const validateFile = (file: File): string | null => {
    // Validar tamaño
    if (!validateFileSize(file, MAX_FILE_SIZE)) {
      return `El archivo excede el límite de ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`;
    }

    // Validar tipo
    if (!validateFileType(file, DEFAULT_ALLOWED_TYPES)) {
      return 'Tipo de archivo no permitido';
    }

    return null;
  };

  const upload = async (options: UploadOptions): Promise<UploadResult> => {
    const { bucket, workspaceId, file, folder = 'misc' } = options;

    try {
      setUploadProgress({ isUploading: true, progress: 10, fileName: file.name });

      // Generate unique file path
      const uniqueFileName = generateUniqueFileName(file.name);
      const path = `${workspaceId}/${folder}/${uniqueFileName}`;
      const contentType = file.type || 'application/octet-stream';

      // Step 1: Get signed upload URL
      setUploadProgress({ isUploading: true, progress: 20, fileName: file.name });
      
      const signedResponse = await fetch('/api/storage/signed-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucket,
          path,
          contentType,
          expiresIn: 120,
        }),
      });

      if (!signedResponse.ok) {
        const errorData = await signedResponse.json().catch(() => ({ error: 'Error obteniendo URL firmada' }));
        throw new Error(errorData.error || 'Error obteniendo URL firmada');
      }

      const signedData: SignedUploadResponse = await signedResponse.json();
      
      // Step 2: Upload directly to Supabase Storage
      setUploadProgress({ isUploading: true, progress: 40, fileName: file.name });
      
      const supabase = getSupabaseClient();
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(path, signedData.token, file, {
          contentType,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('Error uploading to signed URL:', uploadError);
        throw new Error('Error subiendo archivo a storage');
      }

      // Step 3: Commit the upload
      setUploadProgress({ isUploading: true, progress: 80, fileName: file.name });
      
      const commitResponse = await fetch('/api/storage/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucket,
          path,
          size: file.size,
          mime: file.type,
        }),
      });

      if (!commitResponse.ok) {
        const errorData = await commitResponse.json().catch(() => ({ error: 'Error confirmando subida' }));
        throw new Error(errorData.error || 'Error confirmando subida');
      }

      const commitData: CommitUploadResponse = await commitResponse.json();
      setUploadProgress({ isUploading: true, progress: 100, fileName: file.name });
      
      return commitData;
    } catch (error) {
      console.error('Error in direct upload:', error);
      throw new Error(error instanceof Error ? error.message : 'Error subiendo archivo');
    }
  };

  const uploadFile = async (options: UploadOptions): Promise<UploadResult> => {
    // Validar archivo
    const validationError = validateFile(options.file);
    if (validationError) {
      toast.error(validationError);
      throw new Error(validationError);
    }

    try {
      // Upload using direct-to-storage method
      const result = await upload(options);

      // Simular un pequeño delay para mostrar el progreso completo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUploadProgress({ isUploading: false, progress: 0 });
      toast.success('Archivo subido exitosamente');
      
      return result;
    } catch (error) {
      setUploadProgress({ isUploading: false, progress: 0 });
      const errorMessage = error instanceof Error ? error.message : 'Error subiendo archivo';
      toast.error(errorMessage);
      throw error;
    }
  };

  const resetUpload = () => {
    setUploadProgress({ isUploading: false, progress: 0 });
  };

  return {
    upload: uploadFile,
    uploadProgress,
    resetUpload,
    isUploading: uploadProgress.isUploading
  };
}

export default useFileUpload;

// Export types for external use
export type { UploadOptions, UploadResult, UploadProgress };