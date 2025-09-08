import { createClient } from '@/utils/supabase/client'

// Configuración de storage para el módulo de construcción
export const STORAGE_BUCKETS = {
  CONSTRUCTION_DOCUMENTS: 'construction-documents',
  PROJECT_IMAGES: 'project-images'
} as const

// Tipos para documentos
export interface DocumentUpload {
  file: File
  projectId: string
  sectionName: string
  description?: string
  fileUrl?: string // URL de Vercel Blob para archivos grandes
}

export interface ProjectDocument {
  id: string
  project_id: string
  section_name: string
  filename: string
  original_filename: string
  file_url: string
  file_size: number
  mime_type: string
  description?: string
  uploaded_by: string
  created_at: string
}

// Tipos para el manejo de archivos
export interface UploadFileResult {
  success: boolean
  data?: {
    path: string
    publicUrl: string
  }
  error?: string
}

export interface FileUploadOptions {
  bucket: string
  folder?: string
  filename?: string
  contentType?: string
  cacheControl?: string
  upsert?: boolean
}

// Función para subir documentos de proyecto
export async function uploadProjectDocument(uploadData: DocumentUpload): Promise<ProjectDocument> {
  const supabase = createClient()
  
  // Verificar que el usuario esté autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Usuario no autenticado')
  }

  let fileName: string
  let publicUrl: string
  let fileSize: number
  let mimeType: string
  let originalFilename: string

  try {
    // Si se proporciona fileUrl (Vercel Blob), usar esa URL directamente
    if (uploadData.fileUrl) {
      publicUrl = uploadData.fileUrl
      fileName = uploadData.fileUrl.split('/').pop() || 'unknown'
      fileSize = uploadData.file.size || 0
      mimeType = uploadData.file.type || 'application/octet-stream'
      originalFilename = uploadData.file.name || fileName
    } else {
      // Método tradicional: subir a Supabase Storage
      const fileExt = uploadData.file.name.split('.').pop()
      fileName = `${uploadData.projectId}/${uploadData.sectionName}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      // Subir archivo a Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from(STORAGE_BUCKETS.CONSTRUCTION_DOCUMENTS)
        .upload(fileName, uploadData.file, {
          cacheControl: '3600',
          upsert: false
        })

      if (storageError) {
        console.error('Storage error:', storageError)
        throw new Error('Error al subir el archivo')
      }

      // Obtener URL pública del archivo
      const { data: { publicUrl: supabaseUrl } } = supabase.storage
        .from(STORAGE_BUCKETS.CONSTRUCTION_DOCUMENTS)
        .getPublicUrl(fileName)
      
      publicUrl = supabaseUrl
      fileSize = uploadData.file.size
      mimeType = uploadData.file.type
      originalFilename = uploadData.file.name
    }

    // Guardar registro en la base de datos
    const { data: document, error: dbError } = await supabase
      .from('project_documents')
      .insert({
        project_id: uploadData.projectId,
        section_name: uploadData.sectionName,
        filename: fileName,
        original_filename: originalFilename,
        file_url: publicUrl,
        file_size: fileSize,
        mime_type: mimeType,
        description: uploadData.description,
        uploaded_by: user.id
      })
      .select()
      .single()

    if (dbError) {
      // Si hay error en la DB y no es Vercel Blob, intentar eliminar el archivo subido
      if (!uploadData.fileUrl) {
        await supabase.storage
          .from(STORAGE_BUCKETS.CONSTRUCTION_DOCUMENTS)
          .remove([fileName])
      }
      
      console.error('Database error:', dbError)
      throw new Error('Error al guardar la información del documento')
    }

    return document

  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

// Función para obtener documentos de un proyecto
export async function getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
  const supabase = createClient()
  
  const { data: documents, error } = await supabase
    .from('project_documents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching documents:', error)
    throw new Error('Error al cargar los documentos')
  }

  return documents || []
}

// Función para eliminar un documento
export async function deleteProjectDocument(documentId: string): Promise<void> {
  const supabase = createClient()
  
  // Obtener información del documento antes de eliminarlo
  const { data: document, error: fetchError } = await supabase
    .from('project_documents')
    .select('filename')
    .eq('id', documentId)
    .single()

  if (fetchError) {
    throw new Error('Documento no encontrado')
  }

  // Eliminar archivo del storage
  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKETS.CONSTRUCTION_DOCUMENTS)
    .remove([document.filename])

  if (storageError) {
    console.error('Storage delete error:', storageError)
    // Continuar con la eliminación de la DB aunque falle el storage
  }

  // Eliminar registro de la base de datos
  const { error: dbError } = await supabase
    .from('project_documents')
    .delete()
    .eq('id', documentId)

  if (dbError) {
    console.error('Database delete error:', dbError)
    throw new Error('Error al eliminar el documento')
  }
}

// Función para subir imagen de proyecto
export async function uploadProjectImage(projectId: string, file: File): Promise<string> {
  const supabase = createClient()
  
  // Validar que sea una imagen
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen')
  }

  // Validar tamaño (máximo 50MB)
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('La imagen no debe superar los 50MB')
  }

  // Generar nombre único para la imagen
  const fileExt = file.name.split('.').pop()
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2)
  const fileName = `${projectId}/cover-${timestamp}-${randomId}.${fileExt}`

  try {
    // Subir imagen a Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from(STORAGE_BUCKETS.PROJECT_IMAGES)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (storageError) {
      console.error('Storage error:', storageError)
      throw new Error('Error al subir la imagen: ' + storageError.message)
    }

    // Obtener URL pública de la imagen
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKETS.PROJECT_IMAGES)
      .getPublicUrl(fileName)

    return publicUrl

  } catch (error) {
    console.error('Image upload error:', error)
    throw error
  }
}

// Función para validar tipos de archivo permitidos
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -1))
    }
    return file.type === type
  })
}

// Función para formatear tamaño de archivo
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Tipos de archivo permitidos por sección
export const ALLOWED_FILE_TYPES = {
  'Planos de Proyecto e Instalaciones': [
    'image/*', 
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  'Documentación Municipal y Gestoría': [
    'application/pdf',
    'image/*',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  'Servicios Públicos': [
    'application/pdf',
    'image/*',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  'Profesionales Intervinientes': [
    'application/pdf',
    'image/*'
  ],
  'Seguros y Documentación Administrativa': [
    'application/pdf',
    'image/*',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  'Pagos y Comprobantes': [
    'application/pdf',
    'image/*',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  // NUEVA: Verificaciones de Prefactibilidad
  'Verificaciones - Prefactibilidad del proyecto': [
    'application/pdf',
    'image/*',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
} as const 

/**
 * Sube un archivo a Supabase Storage
 */
export async function uploadFile(
  file: File,
  options: FileUploadOptions
): Promise<UploadFileResult> {
  try {
    const supabase = createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      }
    }

    // Generar nombre del archivo si no se proporciona
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = options.filename || `${timestamp}.${fileExtension}`
    
    // Construir la ruta del archivo
    const filePath = options.folder 
      ? `${options.folder}/${fileName}`
      : fileName

    // Convertir File a ArrayBuffer y luego a Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Subir archivo
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(options.bucket)
      .upload(filePath, buffer, {
        contentType: options.contentType || file.type,
        cacheControl: options.cacheControl || '3600',
        upsert: options.upsert || false
      })

    if (uploadError) {
      return {
        success: false,
        error: `Error al subir archivo: ${uploadError.message}`
      }
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(uploadData.path)

    return {
      success: true,
      data: {
        path: uploadData.path,
        publicUrl
      }
    }

  } catch (error) {
    return {
      success: false,
      error: `Error interno: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

/**
 * Elimina un archivo de Supabase Storage
 */
export async function deleteFile(
  bucket: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      return {
        success: false,
        error: `Error al eliminar archivo: ${error.message}`
      }
    }

    return { success: true }

  } catch (error) {
    return {
      success: false,
      error: `Error interno: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

/**
 * Obtiene la URL pública de un archivo
 */
export async function getPublicUrl(
  bucket: string,
  filePath: string
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    const supabase = createClient()

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return {
      success: true,
      publicUrl
    }

  } catch (error) {
    return {
      success: false,
      error: `Error al obtener URL: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

/**
 * Lista archivos en un bucket
 */
export async function listFiles(
  bucket: string,
  folder?: string,
  options?: {
    limit?: number
    offset?: number
    sortBy?: { column: string; order: 'asc' | 'desc' }
  }
): Promise<{ success: boolean; files?: any[]; error?: string }> {
  try {
    const supabase = createClient()

    const { data: files, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: options?.limit,
        offset: options?.offset,
        sortBy: options?.sortBy
      })

    if (error) {
      return {
        success: false,
        error: `Error al listar archivos: ${error.message}`
      }
    }

    return {
      success: true,
      files
    }

  } catch (error) {
    return {
      success: false,
      error: `Error interno: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}