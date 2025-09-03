'use client';

import { useState } from 'react';
import { useDirectFileUpload } from '@/lib/hooks/useDirectFileUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, File, X } from 'lucide-react';
import { sanitizeFileName, generateUniqueFilePath } from '@/lib/utils/file-utils';

interface UnifiedFileUploadProps {
  projectId: string;
  sectionName: string;
  workspaceId: string;
  onUploadSuccess?: (document: any) => void;
  onUploadError?: (error: string) => void;
  acceptedTypes?: string;
  maxSizeMB?: number;
  showDescription?: boolean;
  title?: string;
  description?: string;
}

export function UnifiedFileUpload({
  projectId,
  sectionName,
  workspaceId,
  onUploadSuccess,
  onUploadError,
  acceptedTypes = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  maxSizeMB = 50,
  showDescription = true,
  title = 'Subir Documento',
  description = 'Selecciona un archivo para subir'
}: UnifiedFileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');
  const [result, setResult] = useState<{ success: boolean; document?: any; error?: string } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const { uploadFile, isUploading, progress } = useDirectFileUpload();

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamaño
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const error = `El archivo es demasiado grande. Máximo permitido: ${maxSizeMB}MB`;
      setResult({ success: false, error });
      onUploadError?.(error);
      return;
    }

    setSelectedFile(file);
    setResult(null);
    setLogs([]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    // Validar que todos los datos requeridos estén presentes
    if (!projectId || !sectionName || !workspaceId) {
      const missingData = [];
      if (!projectId) missingData.push('projectId');
      if (!sectionName) missingData.push('sectionName');
      if (!workspaceId) missingData.push('workspaceId');
      
      const errorMessage = `Faltan datos requeridos para Supabase Storage: ${missingData.join(', ')}`;
      setResult({ success: false, error: errorMessage });
      onUploadError?.(errorMessage);
      return;
    }

    try {
      setResult(null);
      setLogs([]);
      setShowLogs(true);

      addLog('Iniciando subida de archivo...');
      addLog(`Archivo: ${selectedFile.name} (${selectedFile.size} bytes)`);
      addLog(`Proyecto: ${projectId}`);
      addLog(`Sección: ${sectionName}`);
      addLog(`Workspace: ${workspaceId}`);

      // Generar ruta única para el archivo
      const path = generateUniqueFilePath({
        companyId: workspaceId,
        projectId,
        section: sectionName,
        fileName: selectedFile.name
      });

      addLog(`Ruta generada: ${path}`);

      // Subir archivo a Supabase Storage usando URL firmada
      addLog('Subiendo archivo a Supabase Storage...');
      const uploadResult = await uploadFile({
        bucket: 'construction-documents',
        path,
        file: selectedFile
      });

      addLog(`Resultado de subida: ${JSON.stringify(uploadResult, null, 2)}`);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Error al subir el archivo');
      }

      addLog('Archivo subido exitosamente a Storage');
      addLog(`URL pública: ${uploadResult.publicUrl}`);

      // Crear documento en la base de datos
      addLog('Creando documento en la base de datos...');
      const response = await fetch('/api/workspace/construction/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: uploadResult.publicUrl,
          fileName: path,
          originalFileName: selectedFile.name,
          projectId,
          sectionName,
          description: fileDescription || `Documento de ${sectionName}`,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type
        })
      });

      addLog(`Respuesta de API: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        addLog(`Error de API: ${JSON.stringify(errorData, null, 2)}`);
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const document = await response.json();
      addLog(`Documento creado: ${JSON.stringify(document, null, 2)}`);

      setResult({ success: true, document });
      addLog('✅ Proceso completado exitosamente');
      
      // Limpiar formulario
      setSelectedFile(null);
      setFileDescription('');
      
      // Callback de éxito
      onUploadSuccess?.(document);

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setResult({ success: false, error: errorMessage });
      addLog(`❌ Error: ${errorMessage}`);
      onUploadError?.(errorMessage);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setResult(null);
    setLogs([]);
    setShowLogs(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selector de archivo */}
        <div className="space-y-2">
          <Label htmlFor="file-upload">Archivo</Label>
          <div className="flex items-center gap-2">
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
              accept={acceptedTypes}
              disabled={isUploading}
              className="flex-1"
            />
            {selectedFile && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFile}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Información del archivo seleccionado */}
        {selectedFile && (
          <div className="p-3 bg-gray-50 rounded-lg space-y-1">
            <div className="flex items-center gap-2">
              <File className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{selectedFile.name}</span>
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>Tamaño:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              <p><strong>Tipo:</strong> {selectedFile.type}</p>
            </div>
          </div>
        )}

        {/* Descripción opcional */}
        {showDescription && selectedFile && (
          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Describe el contenido del documento..."
              value={fileDescription}
              onChange={(e) => setFileDescription(e.target.value)}
              disabled={isUploading}
              rows={3}
            />
          </div>
        )}

        {/* Barra de progreso */}
        {isUploading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center text-gray-600">
              Subiendo... {progress}%
            </p>
          </div>
        )}

        {/* Botón de subida */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full"
        >
          {isUploading ? 'Subiendo...' : 'Subir Archivo'}
        </Button>

        {/* Resultado */}
        {result && (
          <Alert className={result.success ? 'border-green-500' : 'border-red-500'}>
            <AlertDescription>
              {result.success ? (
                <div>
                  <p className="text-green-700 font-medium">✅ Archivo subido exitosamente</p>
                  {result.document && (
                    <p className="text-sm mt-1">
                      <strong>Documento:</strong> {result.document.original_filename}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-red-700">❌ Error: {result.error}</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Logs de debug */}
        {showLogs && logs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Logs de Debug:</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogs(false)}
              >
                Ocultar
              </Button>
            </div>
            <div className="bg-gray-50 p-3 rounded-md max-h-48 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-xs font-mono text-gray-700">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}