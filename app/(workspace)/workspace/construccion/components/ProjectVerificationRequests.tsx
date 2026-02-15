'use client'

import React, { useState, useCallback, useEffect } from 'react'
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
  // Estado para manejar las etapas completadas
  const [completedStages, setCompletedStages] = useState<Set<string>>(new Set())
  const [togglingStages, setTogglingStages] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  // Cargar el estado inicial de etapas completadas
  useEffect(() => {
    const loadCompletedStages = async () => {
      try {
        const response = await fetch(`/api/workspace/construction/stage-completions?projectId=${project.id}`)
        if (response.ok) {
          const data = await response.json()
          // Extraer solo los stage_name de las etapas que están completadas
          const completedStageNames = (data.completedStages || [])
            .filter((stage: any) => stage.completed === true)
            .map((stage: any) => stage.stage_name as string)
          setCompletedStages(new Set<string>(completedStageNames))
        } else {
          console.error('Error al cargar etapas completadas:', response.statusText)
        }
      } catch (error) {
        console.error('Error al cargar etapas completadas:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (project.id) {
      loadCompletedStages()
    }
  }, [project.id])

  // Función para manejar el toggle de completado de etapas
  const handleStageCompletionToggle = useCallback(async (stageName: string) => {
    const isCurrentlyCompleted = completedStages.has(stageName)
    const newCompletedState = !isCurrentlyCompleted

    // Marcar como "toggling" para mostrar loading
    setTogglingStages(prev => new Set(prev).add(stageName))

    try {
      const url = '/api/workspace/construction/stage-completions'
      const payload = {
        projectId: project.id,
        stageName,
        completed: newCompletedState
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()

        // Extraer solo los stage_name de las etapas que están completadas
        const completedStageNames = data.completedStages
          .filter((stage: any) => stage.completed === true)
          .map((stage: any) => stage.stage_name as string)

        // Actualizar el estado local con las etapas completadas
        const newCompletedStages = new Set<string>(completedStageNames)
        setCompletedStages(newCompletedStages)
      } else {
        const errorData = await response.json()
        console.error('Error al actualizar estado de etapa:', errorData.error)
        // TODO: Mostrar mensaje de error al usuario
      }
    } catch (error) {
      console.error('Error al actualizar estado de etapa:', error)
      // TODO: Mostrar mensaje de error al usuario
    } finally {
      // Quitar del estado de "toggling"
      setTogglingStages(prev => {
        const newSet = new Set(prev)
        newSet.delete(stageName)
        return newSet
      })
    }
  }, [completedStages, project.id])
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
              // Props para el sistema de etapas completadas
              isStageCompleted={completedStages.has('Verificaciones - Prefactibilidad del proyecto')}
              onStageCompletionToggle={() => handleStageCompletionToggle('Verificaciones - Prefactibilidad del proyecto')}
              isTogglingCompletion={togglingStages.has('Verificaciones - Prefactibilidad del proyecto')}
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
                  isInitiallyExpanded={false}
                  externalDocuments={getSectionExternalDocs(request.name)}
                  onDocumentUploaded={(): void => {
                    // Marcar que esta sección tiene documentos
                    handleDocumentUploaded(request.name);
                  }}
                  onDocumentDeleted={(): void => {
                    // Manejar eliminación de documento
                  }}
                  // Props para el sistema de etapas completadas
                  isStageCompleted={completedStages.has(request.name)}
                  onStageCompletionToggle={() => handleStageCompletionToggle(request.name)}
                  isTogglingCompletion={togglingStages.has(request.name)}
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
                  onNoDocumentationChange={() => {
                  }}
                  showExpirationDate={shouldShowUploadDate(request.name)}
                  expirationDateLabel="Fecha de carga"
                  expirationDate={uploadDates[request.name] || ''}
                  onExpirationDateChange={(date) => handleUploadDateChange(request.name, date)}
                  onSaveExpirationDate={handleSaveUploadDate}
                  onSetOneYearExpiration={setTodayUploadDate}
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
                  // Props para el sistema de etapas completadas
                  isStageCompleted={completedStages.has(request.name)}
                  onStageCompletionToggle={() => handleStageCompletionToggle(request.name)}
                  isTogglingCompletion={togglingStages.has(request.name)}
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
              .filter(req => ['Conforme de obra', 'Conforme de obra - Plano', 'MH-SUBDIVISION', 'MH-SUBDIVISION - Plano'].includes(req.name))
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
                  acceptedFileTypes={
                    request.name.includes('Plano') ?
                      ['application/pdf', 'application/dwg', 'image/jpeg', 'image/jpg', 'image/png'] :
                      ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
                  }
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
                  // Props para el sistema de etapas completadas
                  isStageCompleted={completedStages.has(request.name)}
                  onStageCompletionToggle={() => handleStageCompletionToggle(request.name)}
                  isTogglingCompletion={togglingStages.has(request.name)}
                />
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}