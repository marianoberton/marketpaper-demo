import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'create-documents-table') {
      try {
        // Crear tabla project_documents usando SQL directo
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS project_documents (
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
        `

        // Intentar crear la tabla ejecutando una consulta que falle si no existe
        const { error: tableError } = await supabase
          .from('project_documents')
          .select('id')
          .limit(1)

        if (tableError && tableError.code === 'PGRST116') {
          // La tabla no existe, pero no podemos crearla directamente desde aquí
          return NextResponse.json({ 
            error: 'Table does not exist and cannot be created via API',
            message: 'You need to create the table manually in your Supabase dashboard',
            sql: createTableSQL
          }, { status: 400 })
        }

        return NextResponse.json({ 
          success: true, 
          message: 'project_documents table already exists or was created successfully' 
        })

      } catch (error) {
        return NextResponse.json({ 
          error: 'Error checking/creating table', 
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    }

    // Verificar datos existentes
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(5)

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(5)

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*)
      `)
      .limit(5)

    // Verificar si existe la tabla project_documents
    const { data: documents, error: documentsError } = await supabase
      .from('project_documents')
      .select('*')
      .limit(5)

    return NextResponse.json({
      database_status: 'connected',
      tables: {
        companies: {
          exists: !companiesError,
          count: companies?.length || 0,
          sample: companies || [],
          error: companiesError?.message
        },
        clients: {
          exists: !clientsError,
          count: clients?.length || 0,
          sample: clients || [],
          error: clientsError?.message
        },
        projects: {
          exists: !projectsError,
          count: projects?.length || 0,
          sample: projects || [],
          error: projectsError?.message
        },
        project_documents: {
          exists: !documentsError || documentsError.code !== 'PGRST116',
          count: documents?.length || 0,
          sample: documents || [],
          error: documentsError?.message,
          error_code: documentsError?.code
        }
      },
      sql_to_run_manually: `
        -- Ejecuta este SQL en tu dashboard de Supabase
        CREATE TABLE IF NOT EXISTS project_documents (
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
        CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);
        CREATE INDEX IF NOT EXISTS idx_project_documents_section_name ON project_documents(section_name);
        CREATE INDEX IF NOT EXISTS idx_project_documents_created_at ON project_documents(created_at);

        -- RLS
        ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
      `,
      actions: {
        create_documents_table: '/api/debug/database?action=create-documents-table'
      }
    })

  } catch (error) {
    console.error('Database debug error:', error)
    return NextResponse.json({
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 