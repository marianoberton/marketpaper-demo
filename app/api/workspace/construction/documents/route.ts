import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth-server'

// Configuración ya no necesaria - archivos van directo a Supabase Storage

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener el usuario actual y su company_id
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    
    // Solo manejar JSON (archivo ya subido a Supabase Storage)
    const body = await request.json()
    
    // Debug: Log de datos recibidos
    console.log('📥 API received data:', JSON.stringify(body, null, 2))
    
    const { fileUrl, fileName, originalFileName, projectId, sectionName, description, fileSize, mimeType } = body
    
    // Debug: Log de validación detallada
    console.log('🔍 Detailed parameter validation:')
    console.log('  fileUrl:', typeof fileUrl, '=', fileUrl, '| empty?', !fileUrl)
    console.log('  fileName:', typeof fileName, '=', fileName, '| empty?', !fileName)
    console.log('  projectId:', typeof projectId, '=', projectId, '| empty?', !projectId)
    console.log('  sectionName:', typeof sectionName, '=', sectionName, '| empty?', !sectionName)
    
    // Identificar exactamente qué parámetros faltan
    const missingParams = []
    if (!fileUrl) missingParams.push('fileUrl')
    if (!fileName) missingParams.push('fileName')
    if (!projectId) missingParams.push('projectId')
    if (!sectionName) missingParams.push('sectionName')
    
    if (missingParams.length > 0) {
      console.log('❌ Missing parameters:', missingParams.join(', '))
      return NextResponse.json(
        { 
          error: 'Faltan datos requeridos para Supabase Storage',
          missing: missingParams,
          received: { fileUrl: !!fileUrl, fileName: !!fileName, projectId: !!projectId, sectionName: !!sectionName }
        },
        { status: 400 }
      )
    }
    
    console.log('✅ Todos los datos requeridos están presentes')

    // Determinar el company_id a usar
    let targetCompanyId: string
    if (currentUser.role === 'super_admin') {
      // Super admin puede trabajar con cualquier empresa, usar la del proyecto
      targetCompanyId = currentUser.company_id || '57bffb9f-78ba-4252-a9ea-10adf83c3155'
    } else {
      // Usuarios regulares solo pueden trabajar con su propia empresa
      if (!currentUser.company_id) {
        return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 400 })
      }
      targetCompanyId = currentUser.company_id
    }
      
    // Validar que el proyecto existe Y pertenece a la empresa del usuario
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, company_id, name')
      .eq('id', projectId)
      .eq('company_id', targetCompanyId)
      .single()

    if (projectError || !project) {
      console.error('Project validation error:', projectError)
      return NextResponse.json(
        { error: `Proyecto no encontrado o sin permisos: ${projectId}` },
        { status: 404 }
      )
    }

    // Guardar registro en la base de datos con URL de Supabase Storage
    const documentData = {
      project_id: projectId,
      section_name: sectionName,
      filename: fileName,
      original_filename: originalFileName || fileName,
      file_url: fileUrl,
      file_size: fileSize || 0,
      mime_type: mimeType || 'application/octet-stream',
      description: description,
      uploaded_by: 'super-admin'
    }

    console.log('Insertando documento:', documentData)

    const { data: document, error: dbError } = await supabase
      .from('project_documents')
      .insert(documentData)
      .select()
      .single()

    if (dbError) {
      console.error('Database error details:', {
        error: dbError,
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint
      })
      return NextResponse.json(
        { 
          error: 'Error al guardar la información del documento',
          details: dbError.message,
          code: dbError.code
        },
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

    // Obtener el usuario actual y su company_id
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Determinar el company_id a usar
    let targetCompanyId: string
    if (currentUser.role === 'super_admin') {
      // Super admin puede trabajar con cualquier empresa
      targetCompanyId = currentUser.company_id || '57bffb9f-78ba-4252-a9ea-10adf83c3155'
    } else {
      // Usuarios regulares solo pueden trabajar con su propia empresa
      if (!currentUser.company_id) {
        return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 400 })
      }
      targetCompanyId = currentUser.company_id
    }

    // Validar que el proyecto existe Y pertenece a la empresa del usuario
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, company_id')
      .eq('id', projectId)
      .eq('company_id', targetCompanyId)
      .single()

    if (projectError || !project) {
      console.error('Project validation error:', projectError)
      return NextResponse.json(
        { error: `Proyecto no encontrado o sin permisos: ${projectId}` },
        { status: 404 }
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