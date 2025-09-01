'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { useDirectFileUpload } from '@/lib/hooks/useDirectFileUpload'
import { WorkspaceProvider, useWorkspace } from '@/components/workspace-context'
import { generateUniqueFilePath } from '@/lib/utils/file-utils'

function TestPrefactibilidadPageContent() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  
  const workspace = useWorkspace()
  const { uploadFile: uploadDocument } = useDirectFileUpload()
  
  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }
  
  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true)
      setError(null)
      setSuccess(null)
      setLogs([])
      
      addLog('Iniciando subida de archivo...')
      addLog(`Archivo: ${file.name} (${file.size} bytes)`)
      addLog(`Workspace ID: ${workspace.companyId}`)
      
      if (!workspace.companyId) {
        throw new Error('No se pudo obtener el ID del workspace')
      }
      
      // Generar ruta única para el archivo
      const path = generateUniqueFilePath({
        companyId: workspace.companyId,
        projectId: '33333333-3333-3333-3333-333333333333',
        section: 'Verificaciones - Prefactibilidad del proyecto',
        fileName: file.name
      })
      
      addLog(`Ruta generada: ${path}`)
      
      // Subir documento usando subida directa con URL firmada
      addLog('Subiendo archivo a Supabase Storage...')
      const result = await uploadDocument({
        bucket: 'construction-documents',
        path,
        file
      })
      
      addLog(`Resultado de subida: ${JSON.stringify(result, null, 2)}`)
      
      if (!result.success) {
        throw new Error(result.error || 'Error al subir el archivo')
      }
      
      addLog('Archivo subido exitosamente a Storage')
      addLog(`URL pública: ${result.publicUrl}`)
      
      // Crear documento en la base de datos
      addLog('Creando documento en la base de datos...')
      const response = await fetch('/api/workspace/construction/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: result.publicUrl,
          fileName: path,
          originalFileName: file.name,
          projectId: '33333333-3333-3333-3333-333333333333',
          sectionName: 'Verificaciones - Prefactibilidad del proyecto',
          description: 'Documento de prueba de Prefactibilidad del proyecto',
          fileSize: file.size,
          mimeType: file.type
        })
      })
      
      addLog(`Respuesta de API: ${response.status} ${response.statusText}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        addLog(`Error de API: ${JSON.stringify(errorData, null, 2)}`)
        throw new Error(errorData.error || `Error ${response.status}`)
      }
      
      const responseData = await response.json()
      addLog(`Documento creado: ${JSON.stringify(responseData, null, 2)}`)
      
      setSuccess(`Documento "${file.name}" cargado exitosamente`)
      addLog('✅ Proceso completado exitosamente')
      
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al subir el archivo: ${errorMessage}`)
      addLog(`❌ Error: ${errorMessage}`)
    } finally {
      setUploading(false)
    }
  }
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    handleFileUpload(file)
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prueba de Carga de Documentos de Prefactibilidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              id="test-file-input"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <Button
              onClick={() => document.getElementById('test-file-input')?.click()}
              disabled={uploading}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Subiendo...' : 'Cargar Documento de Prueba'}
            </Button>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}
          
          {logs.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Logs de Debug:</h3>
              <div className="bg-gray-50 p-3 rounded-md max-h-96 overflow-y-auto">
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
    </div>
  )
}

export default function TestPrefactibilidadPage() {
  return (
    <WorkspaceProvider 
      companyFeatures={['construction']}
      companyId="test-company"
      companyName="Test Company"
      isLoading={false}
      availableModules={[]}
    >
      <TestPrefactibilidadPageContent />
    </WorkspaceProvider>
  )
}