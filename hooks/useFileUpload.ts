"use client";
import { useState, useCallback, useRef } from "react";
import { uploadWithSignedUrl, createUploadController, isValidBucket, getBucketConfig, type UploadParams, type UploadResult } from "@/lib/upload";

// Interfaz para opciones del hook
export interface UseFileUploadOptions {
  defaultBucket?: string;
  onProgress?: (progress: number) => void;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: string) => void;
  validateFile?: (file: File) => { isValid: boolean; error?: string };
}

// Interfaz para el estado del upload
export interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  result: UploadResult | null;
}

// Hook mejorado para upload de archivos
export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    defaultBucket = "docs",
    onProgress,
    onSuccess,
    onError,
    validateFile
  } = options;

  // Estado del upload
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    result: null
  });

  // Referencia al controlador de cancelación
  const abortControllerRef = useRef<AbortController | null>(null);

  // Función para resetear el estado
  const reset = useCallback(() => {
    setState({
      uploading: false,
      progress: 0,
      error: null,
      result: null
    });
    abortControllerRef.current = null;
  }, []);

  // Función para cancelar el upload
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({
      ...prev,
      uploading: false,
      error: "Upload cancelado por el usuario"
    }));
  }, []);

  // Función principal de upload
  const upload = useCallback(async (
    file: File, 
    bucket: string = defaultBucket,
    customPath?: string
  ): Promise<UploadResult> => {
    // Resetear estado anterior
    setState({
      uploading: false,
      progress: 0,
      error: null,
      result: null
    });

    // Validaciones básicas
    if (!file) {
      const error = "Selecciona un archivo";
      setState(prev => ({ ...prev, error }));
      onError?.(error);
      throw new Error(error);
    }

    if (!bucket) {
      const error = "Bucket es requerido";
      setState(prev => ({ ...prev, error }));
      onError?.(error);
      throw new Error(error);
    }

    // Validar bucket
    if (!isValidBucket(bucket)) {
      const error = `Bucket no válido: ${bucket}`;
      setState(prev => ({ ...prev, error }));
      onError?.(error);
      throw new Error(error);
    }

    // Validación personalizada del archivo
    if (validateFile) {
      const validation = validateFile(file);
      if (!validation.isValid) {
        const error = validation.error || "Archivo no válido";
        setState(prev => ({ ...prev, error }));
        onError?.(error);
        throw new Error(error);
      }
    }

    // Validar archivo según configuración del bucket
    const bucketConfig = getBucketConfig(bucket);
    if (bucketConfig) {
      // Validar tamaño
      if (file.size > bucketConfig.maxSize) {
        const maxSizeMB = Math.round(bucketConfig.maxSize / (1024 * 1024));
        const error = `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`;
        setState(prev => ({ ...prev, error }));
        onError?.(error);
        throw new Error(error);
      }

      // Validar tipo de archivo
      const isAllowed = bucketConfig.allowedTypes.some(allowedType => {
        if (allowedType.endsWith('/*')) {
          return file.type.startsWith(allowedType.replace('/*', '/'));
        }
        return file.type === allowedType;
      });

      if (!isAllowed) {
        const error = `Tipo de archivo no permitido: ${file.type}. Tipos permitidos: ${bucketConfig.allowedTypes.join(', ')}`;
        setState(prev => ({ ...prev, error }));
        onError?.(error);
        throw new Error(error);
      }
    }

    // Crear controlador de cancelación
    abortControllerRef.current = createUploadController();

    // Iniciar upload
    setState(prev => ({ ...prev, uploading: true, progress: 0 }));

    try {
      const uploadParams: UploadParams = {
        file,
        bucket,
        path: customPath,
        signal: abortControllerRef.current.signal,
        onProgress: (progress) => {
          setState(prev => ({ ...prev, progress }));
          onProgress?.(progress);
        }
      };

      const result = await uploadWithSignedUrl(uploadParams);

      // Upload exitoso
      setState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
        result,
        error: null
      }));

      onSuccess?.(result);
      return result;

    } catch (error: any) {
      const errorMessage = error.message || "Error desconocido durante el upload";
      
      setState(prev => ({
        ...prev,
        uploading: false,
        error: errorMessage
      }));

      onError?.(errorMessage);
      throw error;
    } finally {
      abortControllerRef.current = null;
    }
  }, [defaultBucket, onProgress, onSuccess, onError, validateFile]);

  // Función para upload múltiple
  const uploadMultiple = useCallback(async (
    files: File[],
    bucket: string = defaultBucket,
    customPath?: string
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await upload(files[i], bucket, customPath);
        results.push(result);
      } catch (error: any) {
        errors.push(`${files[i].name}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Errores en upload múltiple: ${errors.join(', ')}`);
    }

    return results;
  }, [upload, defaultBucket]);

  return {
    // Estado
    uploading: state.uploading,
    progress: state.progress,
    error: state.error,
    result: state.result,
    
    // Funciones
    upload,
    uploadMultiple,
    cancel,
    reset,
    
    // Utilidades
    isValidBucket,
    getBucketConfig
  };
}