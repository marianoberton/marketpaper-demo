'use client';

import { useState } from 'react';
import { useDirectFileUpload } from '@/lib/hooks/useDirectFileUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { sanitizeFileName } from '@/lib/utils/file-utils';

export function DirectFileUploadTest() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ success: boolean; publicUrl?: string; error?: string } | null>(null);
  const { uploadFile, isUploading, progress } = useDirectFileUpload();
  // Campos para jerarquía requerida
  const [companyId, setCompanyId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [section, setSection] = useState('documents');
  // Información del commit en DB
  const [commitInfo, setCommitInfo] = useState<{ id: string } | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
    setResult(null);
    setCommitInfo(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    // Validar jerarquía mínima
    if (!companyId || !projectId || !section) {
      setResult({ success: false, error: 'Faltan datos: companyId, projectId y section son requeridos' });
      return;
    }

    const sanitizedFileName = sanitizeFileName(selectedFile.name);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const path = `${companyId}/projects/${projectId}/${section}/${timestamp}-${sanitizedFileName}`;

    const uploadResult = await uploadFile({
      bucket: 'construction-documents',
      path,
      file: selectedFile,
    });

    setResult(uploadResult);

    // Si la subida fue exitosa, intentar comitear metadatos en DB (proyecto/construcción)
    if (uploadResult.success) {
      try {
        const resp = await fetch('/api/workspace/construction/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileUrl: uploadResult.publicUrl, // URL pública (bucket público) o undefined
            fileName: path, // path en Storage
            originalFileName: selectedFile.name,
            projectId,
            sectionName: section,
            description: `Subida de prueba directa ${new Date().toISOString()}`,
            fileSize: selectedFile.size,
            mimeType: selectedFile.type,
          }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          console.error('Error al comitear documento:', err);
          // Conservamos el éxito de la subida, pero sin commit en DB
          setCommitInfo(null);
          return;
        }

        const data = await resp.json();
        if (data?.id) {
          setCommitInfo({ id: data.id });
        }
      } catch (e) {
        console.error('Excepción comiteando documento:', e);
        setCommitInfo(null);
      }
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Prueba de Subida Directa</CardTitle>
        <CardDescription>
          Prueba la subida directa a Supabase con jerarquía company/projects/project/section
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">companyId</label>
            <Input
              placeholder="empresa-uuid"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              disabled={isUploading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">projectId</label>
            <Input
              placeholder="proyecto-uuid"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={isUploading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">section</label>
            <Input
              placeholder="documents / contracts / ..."
              value={section}
              onChange={(e) => setSection(e.target.value)}
              disabled={isUploading}
            />
          </div>
        </div>

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
                  {commitInfo && (
                    <p className="text-sm mt-1">
                      <strong>DB commit:</strong> ID {commitInfo.id}
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