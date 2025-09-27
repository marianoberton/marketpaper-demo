'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'
import DocumentUpload from './DocumentUpload'

interface VerificationRequest {
  name: string
  required: boolean
}

interface ProjectVerificationRequestsProps {
  project: {
    id: string
  }
  verificationRequests: VerificationRequest[]
  dgiurNoDocsRequired: boolean
  setDgiurNoDocsRequired: (value: boolean) => void
  demolicionNoDocsRequired: boolean
  setDemolicionNoDocsRequired: (value: boolean) => void
  uploadDates: Record<string, string>
  handleUploadDateChange: (requestName: string, date: string) => void
  handleSaveUploadDate: (requestName: string) => void
  setTodayUploadDate: (requestName: string) => void
  savingDates: Record<string, boolean>
  savedUploadDates: Record<string, string>
  shouldShowUploadDate: (requestName: string) => boolean
  hasVerificationCertificate: (requestName: string) => boolean
  getSectionExternalDocs: (sectionName: string) => any[]
  handleDocumentUploaded: (sectionName: string) => void
  loadProjectDocuments: () => void
}

export function ProjectVerificationRequests({
  project,
  verificationRequests,
  dgiurNoDocsRequired,
  setDgiurNoDocsRequired,
  demolicionNoDocsRequired,
  setDemolicionNoDocsRequired,
  uploadDates,
  handleUploadDateChange,
  handleSaveUploadDate,
  setTodayUploadDate,
  savingDates,
  savedUploadDates,
  shouldShowUploadDate,
  hasVerificationCertificate,
  getSectionExternalDocs,
  handleDocumentUploaded,
  loadProjectDocuments
}: ProjectVerificationRequestsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Carga de Documentación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prefactibilidad del proyecto */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b pb-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <h3 className="text-lg font-semibold text-purple-700">Prefactibilidad del proyecto</h3>
          </div>
          <div className="ml-6">
            <DocumentUpload
              projectId={project.id}
              sectionName={'Verificaciones - Prefactibilidad del proyecto'}
              acceptedFileTypes={['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
              onDocumentUploaded={(): void => {
                // Mantener sincronía con el resto del detalle
                loadProjectDocuments();
                // Marcar que esta sección tiene documentos
                handleDocumentUploaded('Verificaciones - Prefactibilidad del proyecto');
              }}
              onDocumentDeleted={(): void => {
                loadProjectDocuments();
              }}
              isInitiallyExpanded={false}
              externalDocuments={getSectionExternalDocs('Verificaciones - Prefactibilidad del proyecto')}
            />
          </div>
        </div>

        {/* En Gestoria */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b pb-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <h3 className="text-lg font-semibold text-yellow-700">En Gestoria</h3>
          </div>
          <div className="space-y-3 ml-6">
            {verificationRequests
              .filter(req => ['Consulta DGIUR', 'Permiso de Demolición - Informe', 'Permiso de Demolición - Plano', 'Registro etapa de proyecto - Informe', 'Registro etapa de proyecto - Plano', 'Permiso de obra'].includes(req.name))
              .map((request, index) => (
                <DocumentUpload
                  key={index}
                  projectId={project.id}
                  sectionName={request.name}
                  showNoDocumentationCheckbox={request.name === 'Consulta DGIUR' || request.name === 'Permiso de Demolición - Informe'}
                  noDocumentationLabel="No requiere documentación"
                  noDocumentationRequired={
                    request.name === 'Consulta DGIUR' ? dgiurNoDocsRequired :
                    request.name === 'Permiso de Demolición - Informe' ? demolicionNoDocsRequired :
                    false
                  }
                  onNoDocumentationChange={(checked) => {
                    if (request.name === 'Consulta DGIUR') {
                      setDgiurNoDocsRequired(checked)
                    } else if (request.name === 'Permiso de Demolición - Informe') {
                      setDemolicionNoDocsRequired(checked)
                    }
                  }}
                  showExpirationDate={shouldShowUploadDate(request.name)}
                  expirationDateLabel="Fecha de carga"
                  expirationDate={uploadDates[request.name] || ''}
                  onExpirationDateChange={(date) => handleUploadDateChange(request.name, date)}
                  onSaveExpirationDate={handleSaveUploadDate}
                  onSetOneYearExpiration={setTodayUploadDate}
                  isSavingDate={savingDates[request.name] || false}
                  savedExpirationDate={savedUploadDates[request.name]}
                  acceptedFileTypes={
                    request.name.includes('Plano') ? 
                      ['application/pdf', 'application/dwg', 'image/jpeg', 'image/jpg', 'image/png'] :
                      ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
                  }
                  isRequired={request.required}
                  showCompletedState={hasVerificationCertificate(request.name)}
                  isCompleted={hasVerificationCertificate(request.name)}
                  completedMessage="Completado"
                  compactMode={true}
                  isInitiallyExpanded={false}
                  externalDocuments={getSectionExternalDocs(request.name)}
                  onDocumentUploaded={(document: any): void => {
                    // Actualizar la lista de documentos de verificación
                    console.log('Documento subido:', document)
                    // Marcar que esta sección tiene documentos
                    handleDocumentUploaded(request.name);
                  }}
                  onDocumentDeleted={(documentId: any): void => {
                    // Manejar eliminación de documento
                    console.log('Documento eliminado:', documentId)
                  }}
                />
            ))}
          </div>
        </div>

        {/* En ejecución de obra */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b pb-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <h3 className="text-lg font-semibold text-green-700">En ejecución de obra</h3>
          </div>
          <div className="space-y-3 ml-6">
            {verificationRequests
              .filter(req => ['Alta Inicio de obra', 'Cartel de Obra', 'Demolición', 'Excavación', 'AVO 1', 'AVO 2', 'AVO 3'].includes(req.name))
              .map((request, index) => (
                <DocumentUpload
                  key={index}
                  projectId={project.id}
                  sectionName={request.name}
                  showNoDocumentationCheckbox={request.name === 'Excavación'}
                  noDocumentationLabel="No requiere documentación"
                  noDocumentationRequired={false}
                  onNoDocumentationChange={(checked) => {
                    console.log(`${request.name} no requiere documentación:`, checked);
                  }}
                  showExpirationDate={shouldShowUploadDate(request.name)}
                  expirationDateLabel="Fecha de carga"
                  expirationDate={uploadDates[request.name] || ''}
                  onExpirationDateChange={(date) => handleUploadDateChange(request.name, date)}
                  onSaveExpirationDate={handleSaveUploadDate}
                  onSetOneYearExpiration={setTodayUploadDate}
                  isRequired={request.required}
                  compactMode={true}
                  requiresDates={true}
                  startDateLabel="Fecha de inicio"
                  endDateLabel="Fecha de fin"
                  onStartDateChange={(date: string): void => {
                    console.log(`${request.name} fecha de inicio:`, date);
                  }}
                  onEndDateChange={(date: string): void => {
                    console.log(`${request.name} fecha de fin:`, date);
                  }}
                  isInitiallyExpanded={false}
                  externalDocuments={getSectionExternalDocs(request.name)}
                  onDocumentUploaded={(document: any): void => {
                    console.log('Documento subido:', document);
                    loadProjectDocuments();
                    // Marcar que esta sección tiene documentos
                    handleDocumentUploaded(request.name);
                  }}
                  onDocumentDeleted={(): void => {
                    loadProjectDocuments();
                  }}
                />
            ))}
          </div>
        </div>

        {/* Finalización */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b pb-2">
            <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
            <h3 className="text-lg font-semibold text-emerald-700">Finalización</h3>
          </div>
          <div className="space-y-3 ml-6">
            {verificationRequests
              .filter(req => ['Conforme de obra', 'MH-SUBDIVISION'].includes(req.name))
              .map((request, index) => (
                <DocumentUpload
                  key={index}
                  projectId={project.id}
                  sectionName={request.name}
                  showExpirationDate={shouldShowUploadDate(request.name)}
                  expirationDateLabel="Fecha de carga"
                  expirationDate={uploadDates[request.name] || ''}
                  onExpirationDateChange={(date: string): void => handleUploadDateChange(request.name, date)}
                  onSaveExpirationDate={handleSaveUploadDate}
                  onSetOneYearExpiration={setTodayUploadDate}
                  isSavingDate={savingDates[request.name] || false}
                  savedExpirationDate={savedUploadDates[request.name]}
                  acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']}
                  isRequired={request.required}
                  compactMode={true}
                  isInitiallyExpanded={false}
                  externalDocuments={getSectionExternalDocs(request.name)}
                  onDocumentUploaded={(): void => {
                    loadProjectDocuments();
                    // Marcar que esta sección tiene documentos
                    handleDocumentUploaded(request.name);
                  }}
                  onDocumentDeleted={(): void => {
                    loadProjectDocuments();
                  }}
                />
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}