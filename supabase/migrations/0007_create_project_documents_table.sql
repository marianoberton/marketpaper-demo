-- Crear tabla para documentos de proyectos
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
    uploaded_by TEXT NOT NULL, -- En modo super admin usamos texto en lugar de UUID
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_section_name ON project_documents(section_name);
CREATE INDEX IF NOT EXISTS idx_project_documents_created_at ON project_documents(created_at);

-- Habilitar RLS
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para project_documents
CREATE POLICY "Authenticated users can view project documents"
ON project_documents FOR SELECT
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

CREATE POLICY "Authenticated users can create project documents"
ON project_documents FOR INSERT
WITH CHECK ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

CREATE POLICY "Authenticated users can update project documents"
ON project_documents FOR UPDATE
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

CREATE POLICY "Authenticated users can delete project documents"
ON project_documents FOR DELETE
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_project_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_project_documents_updated_at
    BEFORE UPDATE ON project_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_project_documents_updated_at(); 