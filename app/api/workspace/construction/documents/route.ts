import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Configuración para permitir archivos más grandes
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // En modo super admin, no verificamos autenticación de usuario
    // pero sí necesitamos una conexión válida a Supabase
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const sectionName = formData.get('sectionName') as string
    const description = formData.get('description') as string

    if (!file || !projectId || !sectionName) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido' },
        { status: 400 }
      )
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 10MB.' },
        { status: 400 }
      )
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2)
    
    // Sanitizar el nombre de la sección para evitar problemas con caracteres especiales
    const sanitizedSectionName = sectionName
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
      .toLowerCase()
    
    const fileName = `${projectId}/${sanitizedSectionName}/${timestamp}-${randomStr}.${fileExt}`

    try {
      // Subir archivo a Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('construction-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (storageError) {
        console.error('Storage error:', storageError)
        return NextResponse.json(
          { error: 'Error al subir el archivo al storage' },
          { status: 500 }
        )
      }

      // Obtener URL pública del archivo
      const { data: { publicUrl } } = supabase.storage
        .from('construction-documents')
        .getPublicUrl(fileName)

      // Guardar registro en la base de datos
      const { data: document, error: dbError } = await supabase
        .from('project_documents')
        .insert({
          project_id: projectId,
          section_name: sectionName,
          filename: fileName,
          original_filename: file.name,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          description: description,
          uploaded_by: 'super-admin' // En modo super admin
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        
        // Si hay error en la DB, intentar eliminar el archivo subido
        await supabase.storage
          .from('construction-documents')
          .remove([fileName])
        
        return NextResponse.json(
          { error: 'Error al guardar la información del documento' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        id: document.id,
        filename: document.filename,
        original_filename: document.original_filename,
        file_url: document.file_url,
        file_size: document.file_size,
        mime_type: document.mime_type,
        section_name: document.section_name,
        description: document.description,
        created_at: document.created_at
      })

    } catch (error) {
      console.error('Upload error:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Request processing error:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID requerido' },
        { status: 400 }
      )
    }

    // Obtener información del documento antes de eliminarlo
    const { data: document, error: fetchError } = await supabase
      .from('project_documents')
      .select('filename, original_filename')
      .eq('id', documentId)
      .single()

    if (fetchError || !document) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar archivo del storage
    const { error: storageError } = await supabase.storage
      .from('construction-documents')
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
      return NextResponse.json(
        { error: 'Error al eliminar el documento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Documento "${document.original_filename}" eliminado exitosamente`
    })

  } catch (error) {
    console.error('Delete request processing error:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud de eliminación' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID requerido' },
        { status: 400 }
      )
    }

    const { data: documents, error } = await supabase
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      
      // Si la tabla no tiene la estructura correcta
      if (error.code === '42703') {
        return NextResponse.json(
          { 
            error: 'La tabla project_documents no tiene la estructura correcta. Necesita ser recreada.',
            details: error.message,
            sql_needed: `
              -- Eliminar tabla existente y recrear con estructura correcta
              DROP TABLE IF EXISTS project_documents;
              
              CREATE TABLE project_documents (
                  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
                  section_name TEXT NOT NULL,
                  filename TEXT NOT NULL,
                  original_filename TEXT NOT NULL,
                  file_url TEXT NOT NULL,
                  file_size BIGINT NOT NULL,
                  mime_type TEXT NOT NULL,
                  description TEXT,
                  uploaded_by TEXT NOT NULL,
                  created_at TIMESTAMPTZ DEFAULT NOW(),
                  updated_at TIMESTAMPTZ DEFAULT NOW()
              );

              -- Índices
              CREATE INDEX idx_project_documents_project_id ON project_documents(project_id);
              CREATE INDEX idx_project_documents_section_name ON project_documents(section_name);
              CREATE INDEX idx_project_documents_created_at ON project_documents(created_at);

              -- RLS
              ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
            `
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Error al cargar los documentos', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(documents || [])

  } catch (error) {
    console.error('Request processing error:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}