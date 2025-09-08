'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { useDirectFileUpload } from '@/lib/hooks/useDirectFileUpload'
import { useWorkspace } from '@/components/workspace-context'
import { generateUniqueFilePath } from '@/lib/utils/file-utils'

export default function DebugUploadClientPage() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const workspace = useWorkspace()
  const { uploadFile: uploadDocument } = useDirectFileUpload()

  const addLog = (message: string) => {
    console.log('[DebugUpload]', message)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true)
      setError(null)
      setSuccess(null)
      setLogs([])

      const projectId = (document.getElementById('project-id') as HTMLInputElement)?.value || ''
      const sectionName = (document.getElementById('section-name') as HTMLInputElement)?.value || ''

      addLog(`Workspace ID: ${workspace.companyId}`)
      addLog(`Proyecto: ${projectId}`)
      addLog(`Sección: ${sectionName}`)

      if (!workspace.companyId || !projectId || !sectionName) {
        const missing = [] as string[]
        if (!workspace.companyId) missing.push('companyId')
        if (!projectId) missing.push('projectId')
        if (!sectionName) missing.push('sectionName')
        throw new Error(`Faltan datos requeridos: ${missing.join(', ')}`)
      }

      const path = generateUniqueFilePath({
        companyId: workspace.companyId,
        projectId,
        section: sectionName,
        fileName: file.name
      })

      addLog(`Ruta generada: ${path}`)

      addLog('Subiendo a Supabase Storage...')
      const result = await uploadDocument({
        bucket: 'construction-documents',
        path,
        file
      })
      addLog(`Resultado Storage: ${JSON.stringify(result)}`)

      if (!result.success || !result.publicUrl) {
        throw new Error(result.error || 'Upload fallido o sin publicUrl')
      }

      addLog('Creando documento en DB...')
      const response = await fetch('/api/workspace/construction/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: result.publicUrl,
          fileName: path,
          originalFileName: file.name,
          projectId,
          sectionName,
          description: 'Debug Upload',
          fileSize: file.size,
          mimeType: file.type
        })
      })

      addLog(`API status: ${response.status}`)
      const data = await response.json().catch(() => ({}))
      addLog(`API body: ${JSON.stringify(data)}`)

      if (!response.ok) {
        throw new Error(data.error || 'Error API al crear documento')
      }
      setSuccess('✅ Documento creado correctamente')
    } catch (e: any) {
      const msg = e?.message || 'Error desconocido'
      setError(msg)
      addLog(`❌ ${msg}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug Upload Construcción</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input id="project-id" placeholder="projectId (UUID)" className="border rounded px-3 py-2" />
            <input id="section-name" placeholder="sectionName (texto)" className="border rounded px-3 py-2" />
          </div>

          <div className="space-y-2">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="hidden"
              id="debug-file-input"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFileUpload(f)
              }}
              disabled={uploading}
            />
            <Button onClick={() => document.getElementById('debug-file-input')?.click()} disabled={uploading} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Subiendo...' : 'Seleccionar archivo y subir'}
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md"><p className="text-sm text-red-600">{error}</p></div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md"><p className="text-sm text-green-600">{success}</p></div>
          )}

          {logs.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Logs</h3>
              <div className="bg-gray-50 p-3 rounded-md max-h-96 overflow-y-auto">
                {logs.map((l, i) => (
                  <div key={i} className="text-xs font-mono text-gray-700">{l}</div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}