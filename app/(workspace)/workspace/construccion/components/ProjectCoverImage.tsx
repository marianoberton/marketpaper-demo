'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building, Camera, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Project } from '@/lib/construction'
import { useDirectFileUpload } from '@/lib/hooks/useDirectFileUpload'
import { sanitizeFileName } from '@/lib/utils/file-utils'

interface ProjectCoverImageProps {
  project: Project
  editedProject: Project
  setEditedProject: (project: Project | ((prev: Project) => Project)) => void
  onProjectUpdate?: (updatedProject: Project) => void
}

export default function ProjectCoverImage({ 
  project, 
  editedProject, 
  setEditedProject, 
  onProjectUpdate 
}: ProjectCoverImageProps) {
  const [uploadingImage, setUploadingImage] = useState(false)
  
  // Hook para manejar subidas de imágenes con Supabase Storage
  const { uploadFile, progress: imageUploadProgress, isUploading: isUploadingImage } = useDirectFileUpload()
  
  const handleImageUploadSuccess = async (fileUrl: string, fileName: string) => {
    try {
      // Actualizar proyecto con la nueva imagen
      const response = await fetch('/api/workspace/construction/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: project.id,
          cover_image_url: fileUrl
        }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el proyecto')
      }

      const data = await response.json()
      const updatedProject = data.project
      
      // Actualizar el proyecto local
      setEditedProject(updatedProject)
      
      // Notificar al componente padre si existe la función
      if (onProjectUpdate) {
        onProjectUpdate(updatedProject)
      }
    } catch (error) {
      console.error('Error updating project with image URL:', error)
      toast.error('Error al actualizar el proyecto con la imagen. Por favor, inténtalo de nuevo.')
    }
  }
  
  const handleImageUploadError = (error: string) => {
    toast.error(`Error al subir la imagen: ${error}`)
  }

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true)
      // Subir imagen usando el nuevo sistema de upload directo a Supabase Storage
      const timestamp = Date.now()
      const sanitizedFileName = sanitizeFileName(file.name)
      const fileName = `${timestamp}-${sanitizedFileName}`
      const result = await uploadFile({
        bucket: 'company-logos',
        path: `project-covers/${fileName}`,
        file
      })
      
      // Manejar éxito de la subida
      if (result.publicUrl) {
        await handleImageUploadSuccess(result.publicUrl, file.name)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      handleImageUploadError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setUploadingImage(false)
    }
  }

  return (
    <div className="w-full">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative h-80 bg-muted">
            {editedProject.cover_image_url ? (
              <img
                src={editedProject.cover_image_url}
                alt={editedProject.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted">
                <div className="text-center">
                  <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">Imagen del Proyecto</p>
                  <p className="text-muted-foreground/70 text-sm">No disponible</p>
                </div>
              </div>
            )}
            
            {/* Overlay con información del proyecto */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <h3 className="font-bold text-2xl mb-2">{editedProject.name}</h3>
              <p className="text-lg opacity-90 mb-1">{editedProject.address}</p>
              {(editedProject.barrio || editedProject.ciudad) && (
                <div className="flex items-center gap-2 text-sm opacity-75">
                  {editedProject.barrio && <span>{editedProject.barrio}</span>}
                  {editedProject.barrio && editedProject.ciudad && <span>•</span>}
                  {editedProject.ciudad && <span>{editedProject.ciudad}</span>}
                </div>
              )}
            </div>
            
            {/* Botón para editar imagen */}
            <div className="absolute top-6 right-6">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="project-image-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleImageUpload(file)
                  }
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                className="bg-card/90 hover:bg-card text-foreground shadow-lg"
                onClick={() => document.getElementById('project-image-upload')?.click()}
                disabled={uploadingImage || isUploadingImage}
              >
                {uploadingImage || isUploadingImage ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    {editedProject.cover_image_url ? 'Cambiar' : 'Agregar'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}