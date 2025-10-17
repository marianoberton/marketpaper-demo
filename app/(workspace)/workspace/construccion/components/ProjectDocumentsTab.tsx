'use client'

import { FileText } from 'lucide-react'
import { Project } from '@/lib/construction'
import ProjectAllDocuments from './ProjectAllDocuments'

interface ProjectDocumentsTabProps {
  project: Project
  documents: any[]
  uploadingTo: string | null
  loading: boolean
  tableExists: boolean
  uploading: boolean
  uploadingImage: boolean
  currentUploadSection: string | null
  dgiurNoDocsRequired: boolean
  demolicionNoDocsRequired: boolean
  expedientes: any[]
  uploadDates: Record<string, string>
  onDocumentUploaded: (section: string, file: File) => void
  onImageUploadSuccess: (section: string, url: string) => void
  onImageUploadError: (section: string, error: string) => void
  shouldShowUploadDate: (section: string) => boolean
  onUploadDateChange: (section: string, date: string) => void
  onSaveUploadDate: (section: string) => void
  setTodayUploadDate: (section: string) => void
}

export default function ProjectDocumentsTab({
  project,
  documents,
  uploadingTo,
  loading,
  tableExists,
  uploading,
  uploadingImage,
  currentUploadSection,
  dgiurNoDocsRequired,
  demolicionNoDocsRequired,
  expedientes,
  uploadDates,
  onDocumentUploaded,
  onImageUploadSuccess,
  onImageUploadError,
  shouldShowUploadDate,
  onUploadDateChange,
  onSaveUploadDate,
  setTodayUploadDate
}: ProjectDocumentsTabProps) {
  // Función para obtener el icono del archivo
  const getFileIcon = (type: string) => {
    if (type === 'pdf') return '📄'
    if (type === 'image') return '🖼️'
    return '📎'
  }

  // Funciones de manejo de documentos
  const handleFileUpload = (file: File, section: string) => {
    onDocumentUploaded(section, file)
  }

  const handleViewDocument = (document: any) => {
    if (document.url) {
      window.open(document.url, '_blank')
    }
  }

  const handleDownloadDocument = (document: any) => {
    if (document.url) {
      const link = document.createElement('a')
      link.href = document.url
      link.download = document.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleDeleteDocument = (documentId: string) => {
    // Implementar lógica de eliminación
    console.log('Eliminar documento:', documentId)
  }

  return (
    <div className="space-y-6">
      {/* Encabezado de la pestaña */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Biblioteca de Documentos
          </h2>
          <p className="text-gray-600 mt-1">
            Archivo central con todos los documentos del proyecto organizados.
          </p>
        </div>
      </div>

      {/* Componente ProjectAllDocuments */}
      <ProjectAllDocuments
        documents={documents}
        loading={loading}
        tableExists={tableExists}
        uploading={uploading}
        uploadingTo={uploadingTo}
        setUploadingTo={() => {}}
        handleFileUpload={handleFileUpload}
        handleViewDocument={handleViewDocument}
        handleDownloadDocument={handleDownloadDocument}
        handleDeleteDocument={handleDeleteDocument}
        getFileIcon={getFileIcon}
      />
    </div>
  )
}