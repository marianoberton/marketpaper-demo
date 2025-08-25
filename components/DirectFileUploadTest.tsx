'use client';

import { useState } from 'react';
import { useDirectFileUpload } from '@/lib/hooks/useDirectFileUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function DirectFileUploadTest() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ success: boolean; publicUrl?: string; error?: string } | null>(null);
  const { uploadFile, isUploading, progress } = useDirectFileUpload();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const workspaceId = 'test-workspace-123';
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = selectedFile.name;
    const path = `${workspaceId}/documents/${timestamp}/${fileName}`;

    const uploadResult = await uploadFile({
      bucket: 'construction-documents',
      path,
      file: selectedFile,
    });

    setResult(uploadResult);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Prueba de Subida Directa</CardTitle>
        <CardDescription>
          Prueba la nueva funcionalidad de subida directa a Supabase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            disabled={isUploading}
          />
        </div>

        {selectedFile && (
          <div className="text-sm text-gray-600">
            <p><strong>Archivo:</strong> {selectedFile.name}</p>
            <p><strong>Tamaño:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            <p><strong>Tipo:</strong> {selectedFile.type}</p>
          </div>
        )}

        {isUploading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center text-gray-600">
              Subiendo... {progress}%
            </p>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full"
        >
          {isUploading ? 'Subiendo...' : 'Subir Archivo'}
        </Button>

        {result && (
          <Alert className={result.success ? 'border-green-500' : 'border-red-500'}>
            <AlertDescription>
              {result.success ? (
                <div>
                  <p className="text-green-700 font-medium">✅ Archivo subido exitosamente</p>
                  {result.publicUrl && (
                    <p className="text-sm mt-1">
                      <strong>URL:</strong>{' '}
                      <a
                        href={result.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Ver archivo
                      </a>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-red-700">❌ Error: {result.error}</p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}