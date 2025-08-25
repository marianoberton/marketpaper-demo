'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  generateUniqueFileName,
  validateFileType,
  validateFileSize,
} from '@/lib/files';
import type {
  AllowedBucket,
  SignedUploadResponse,
  CommitUploadResponse,
} from '@/types/storage';

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
  'image/vnd.dwg',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function useFileUpload() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    isUploading: false,
    progress: 0,
  });

  const validateFile = (file: File): string | null => {
    if (!validateFileSize(file, MAX_FILE_SIZE)) {
      return `El archivo excede el límite de ${Math.round(
        MAX_FILE_SIZE / (1024 * 1024)
      )}MB`;
    }
    if (!validateFileType(file, DEFAULT_ALLOWED_TYPES)) {
      return 'Tipo de archivo no permitido';
    }
    return null;
  };

  const upload = async (options: UploadOptions): Promise<UploadResult> => {
    const { bucket, workspaceId, file, folder = 'misc' } = options;

    setUploadProgress({ isUploading: true, progress: 10, fileName: file.name });

    const uniqueFileName = generateUniqueFileName(file.name);
    const path = `${workspaceId}/${folder}/${uniqueFileName}`;
    const contentType = file.type || 'application/octet-stream';

    try {
      // Step 1: Get signed upload URL
      setUploadProgress({ isUploading: true, progress: 20, fileName: file.name });
      const signedResponse = await fetch('/api/storage/signed-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket, path, contentType }),
      });

      if (!signedResponse.ok) {
        const errorData = await signedResponse.json().catch(() => ({}));
        console.error('Error getting signed URL:', {
          status: signedResponse.status,
          statusText: signedResponse.statusText,
          body: errorData,
        });
        throw new Error(
          errorData.error || 'No se pudo obtener la URL de subida firmada.'
        );
      }
      const signedData: SignedUploadResponse = await signedResponse.json();

      // Step 2: Upload directly to Supabase Storage
      setUploadProgress({ isUploading: true, progress: 40, fileName: file.name });
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(path, signedData.token, file, {
          upsert: false, // Ensure we don't overwrite existing files
        });

      if (uploadError) {
        console.error('Error uploading to signed URL:', uploadError);
        throw new Error('Error al subir el archivo a Supabase Storage.');
      }

      // Step 3: Commit the upload
      setUploadProgress({ isUploading: true, progress: 80, fileName: file.name });
      const commitResponse = await fetch('/api/storage/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket,
          path,
          size: file.size,
          mime: file.type,
        }),
      });

      if (!commitResponse.ok) {
        const errorData = await commitResponse.json().catch(() => ({}));
        console.error('Error committing upload:', {
          status: commitResponse.status,
          statusText: commitResponse.statusText,
          body: errorData,
        });
        throw new Error(errorData.error || 'No se pudo confirmar la subida.');
      }

      const commitData: CommitUploadResponse = await commitResponse.json();
      setUploadProgress({ isUploading: true, progress: 100, fileName: file.name });

      return commitData;
    } catch (error) {
      console.error('Direct upload process failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Ocurrió un error inesperado durante la subida.'
      );
    }
  };

  const uploadFile = async (options: UploadOptions): Promise<UploadResult> => {
    const validationError = validateFile(options.file);
    if (validationError) {
      toast.error(validationError);
      throw new Error(validationError);
    }

    try {
      const result = await upload(options);
      await new Promise(resolve => setTimeout(resolve, 500));
      setUploadProgress({ isUploading: false, progress: 0 });
      toast.success('Archivo subido exitosamente.');
      return result;
    } catch (error) {
      setUploadProgress({ isUploading: false, progress: 0 });
      const errorMessage =
        error instanceof Error ? error.message : 'Error subiendo archivo.';
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
    isUploading: uploadProgress.isUploading,
  };
}

export default useFileUpload;

export type { UploadOptions, UploadResult, UploadProgress };