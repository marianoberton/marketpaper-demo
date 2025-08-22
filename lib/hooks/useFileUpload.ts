'use client';

import { useState } from 'react';
import { upload } from '@vercel/blob/client';
import { toast } from 'sonner';

interface UseFileUploadOptions {
  maxSize?: number; // en bytes, default 50MB
  allowedTypes?: string[];
  onSuccess?: (fileUrl: string, fileName: string) => void;
  onError?: (error: string) => void;
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

const VERCEL_LIMIT = 4.5 * 1024 * 1024; // 4.5MB - límite de Vercel Functions

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    maxSize = 50 * 1024 * 1024, // 50MB por defecto
    allowedTypes = DEFAULT_ALLOWED_TYPES,
    onSuccess,
    onError
  } = options;

  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    isUploading: false,
    progress: 0
  });

  const validateFile = (file: File): string | null => {
    // Validar tamaño
    if (file.size > maxSize) {
      return `El archivo excede el límite de ${Math.round(maxSize / (1024 * 1024))}MB`;
    }

    // Validar tipo
    if (!allowedTypes.includes(file.type)) {
      return 'Tipo de archivo no permitido';
    }

    return null;
  };

  const uploadWithVercelBlob = async (file: File): Promise<string> => {
    try {
      setUploadProgress({ isUploading: true, progress: 10, fileName: file.name });
      
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/blob/upload',
        clientPayload: JSON.stringify({
          size: file.size,
          type: file.type,
          name: file.name
        })
      });

      setUploadProgress({ isUploading: true, progress: 100, fileName: file.name });
      return blob.url;
    } catch (error) {
      console.error('Error uploading with Vercel Blob:', error);
      throw new Error(error instanceof Error ? error.message : 'Error subiendo archivo');
    }
  };

  const uploadWithTraditionalMethod = async (file: File, endpoint: string): Promise<string> => {
    try {
      setUploadProgress({ isUploading: true, progress: 10, fileName: file.name });
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      setUploadProgress({ isUploading: true, progress: 80, fileName: file.name });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const data = await response.json();
      setUploadProgress({ isUploading: true, progress: 100, fileName: file.name });
      
      return data.fileUrl || data.url;
    } catch (error) {
      console.error('Error uploading with traditional method:', error);
      throw new Error(error instanceof Error ? error.message : 'Error subiendo archivo');
    }
  };

  const uploadFile = async (file: File, traditionalEndpoint?: string): Promise<string> => {
    // Validar archivo
    const validationError = validateFile(file);
    if (validationError) {
      const error = validationError;
      onError?.(error);
      toast.error(error);
      throw new Error(error);
    }

    try {
      let fileUrl: string;

      // Decidir método de subida basado en el tamaño del archivo
      if (file.size > VERCEL_LIMIT) {
        // Usar Vercel Blob para archivos grandes
        toast.info('Archivo grande detectado, usando subida optimizada...');
        fileUrl = await uploadWithVercelBlob(file);
      } else if (traditionalEndpoint) {
        // Usar método tradicional para archivos pequeños
        fileUrl = await uploadWithTraditionalMethod(file, traditionalEndpoint);
      } else {
        // Si no hay endpoint tradicional, usar Vercel Blob siempre
        fileUrl = await uploadWithVercelBlob(file);
      }

      // Simular un pequeño delay para mostrar el progreso completo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUploadProgress({ isUploading: false, progress: 0 });
      onSuccess?.(fileUrl, file.name);
      toast.success('Archivo subido exitosamente');
      
      return fileUrl;
    } catch (error) {
      setUploadProgress({ isUploading: false, progress: 0 });
      const errorMessage = error instanceof Error ? error.message : 'Error subiendo archivo';
      onError?.(errorMessage);
      toast.error(errorMessage);
      throw error;
    }
  };

  const resetUpload = () => {
    setUploadProgress({ isUploading: false, progress: 0 });
  };

  return {
    uploadFile,
    uploadProgress,
    resetUpload,
    isUploading: uploadProgress.isUploading
  };
}

export default useFileUpload;