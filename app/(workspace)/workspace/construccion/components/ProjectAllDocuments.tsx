'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Upload, Eye, Download, Trash2, AlertCircle } from 'lucide-react'

// Tipo para documentos del proyecto
interface ProjectDocument {
  id: string
  name: string
  section: string
  uploadDate: string
  size: string
  type: string
  url?: string
  isSpecial?: boolean
  validUntil?: string
  isValid?: boolean
}

interface ProjectAllDocumentsProps {
  documents: ProjectDocument[]
  loading: boolean
  tableExists: boolean
  uploading: boolean
  uploadingTo: string | null
  setUploadingTo: (value: string | null) => void
  handleFileUpload: (file: File, section: string) => void
  handleViewDocument: (document: ProjectDocument) => void
  handleDownloadDocument: (document: ProjectDocument) => void
  handleDeleteDocument: (documentId: string) => void
  getFileIcon: (type: string) => string
}

export default function ProjectAllDocuments({
  documents,
  loading,
  tableExists,
  uploading,
  uploadingTo,
  setUploadingTo,
  handleFileUpload,
  handleViewDocument,
  handleDownloadDocument,
  handleDeleteDocument,
  getFileIcon
}: ProjectAllDocumentsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Todos los Documentos
          <Badge variant="outline" className="ml-2">{documents.length} documentos</Badge>
        </CardTitle>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            multiple
            className="hidden"
            id="document-upload"
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              files.forEach(file => {
                if (uploadingTo) {
                  handleFileUpload(file, uploadingTo)
                }
              })
            }}
          />
          <Select onValueChange={(value) => setUploadingTo(value)}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Seleccionar sección..." />
            </SelectTrigger>
            <SelectContent>
              {/* Documentos especiales */}
              <SelectItem value="Informe de Dominio">Informe de Dominio</SelectItem>
              <SelectItem value="Póliza de Seguro">Póliza de Seguro</SelectItem>
              <SelectItem value="Informe de Inhibición">Informe de Inhibición</SelectItem>
              
              {/* Etapas del proyecto */}
              <SelectItem value="Prefactibilidad del proyecto">Prefactibilidad del proyecto</SelectItem>
              <SelectItem value="Consulta DGIUR">Consulta DGIUR</SelectItem>
              <SelectItem value="Permiso de Demolición">Permiso de Demolición</SelectItem>
              <SelectItem value="Registro etapa de proyecto">Registro etapa de proyecto</SelectItem>
              <SelectItem value="Permiso de obra">Permiso de obra</SelectItem>
              <SelectItem value="Alta Inicio de obra">Alta Inicio de obra</SelectItem>
              <SelectItem value="Cartel de Obra">Cartel de Obra</SelectItem>
              <SelectItem value="Demolición">Demolición</SelectItem>
              <SelectItem value="Excavación">Excavación</SelectItem>
              <SelectItem value="AVO 1">AVO 1</SelectItem>
              <SelectItem value="AVO 2">AVO 2</SelectItem>
              <SelectItem value="AVO 3">AVO 3</SelectItem>
              <SelectItem value="Conforme de obra">Conforme de obra</SelectItem>
              <SelectItem value="MH-SUBDIVISION">MH-SUBDIVISION</SelectItem>
            </SelectContent>
          </Select>
          <Button
            disabled={!uploadingTo || uploading}
            onClick={() => document.getElementById('document-upload')?.click()}
          >
            {uploading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Cargar Documentos
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!tableExists && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              <strong>Problema con la tabla de documentos</strong>
            </div>
            <p className="text-sm text-yellow-700 mt-2">
              La tabla &apos;project_documents&apos; no existe o no tiene la estructura correcta. 
              Mostrando datos de ejemplo. Para arreglar esto:
            </p>
            <ol className="text-sm text-yellow-700 mt-2 ml-4 list-decimal">
              <li>Ve a tu dashboard de Supabase → SQL Editor</li>
              <li>Ejecuta el SQL de corrección (ver consola del navegador)</li>
              <li>Recarga esta página</li>
            </ol>
            <div className="mt-3 p-2 bg-yellow-100 rounded text-xs font-mono text-yellow-800">
              DROP TABLE IF EXISTS project_documents; CREATE TABLE project_documents (...);
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Cargando documentos...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay documentos regulares cargados</p>
            <p className="text-sm mt-2">Use las secciones superiores para gestionar informe de dominio y tasas</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Agrupar documentos por sección */}
            {Object.entries(
              documents.reduce((acc, doc) => {
                if (!acc[doc.section]) {
                  acc[doc.section] = []
                }
                acc[doc.section].push(doc)
                return acc
              }, {} as Record<string, typeof documents>)
            ).map(([section, sectionDocs]) => (
              <div key={section}>
                <h4 className="font-medium text-sm text-gray-700 mb-3 pb-2 border-b">
                  {section} ({sectionDocs.length} documento{sectionDocs.length !== 1 ? 's' : ''})
                </h4>
                <div className="space-y-2">
                  {sectionDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFileIcon(doc.type)}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{doc.name}</h4>
                            {doc.isSpecial && (
                              <Badge variant={doc.isValid ? "default" : "destructive"} className="text-xs">
                                {doc.isValid ? 'Válido' : 'Vencido'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{doc.uploadDate}</span>
                            <span>{doc.size}</span>
                            {doc.validUntil && (
                              <span>Vence: {new Date(doc.validUntil).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewDocument(doc)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownloadDocument(doc)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        {!doc.isSpecial && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}