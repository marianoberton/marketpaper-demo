-- Creamos la tabla de proyectos de construcción
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    surface NUMERIC,
    architect TEXT,
    builder TEXT,
    status TEXT,
    cover_image_url TEXT,
    dgro_file_number TEXT,
    project_type TEXT,
    project_use TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitamos RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios autenticados pueden ver los proyectos de su compañía.
CREATE POLICY "Authenticated users can view projects"
ON projects FOR SELECT
USING ( public.is_super_admin() OR (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) );

-- Política: Los usuarios pueden insertar proyectos para su compañía.
CREATE POLICY "Authenticated users can create projects"
ON projects FOR INSERT
WITH CHECK ( public.is_super_admin() OR (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) );

-- Política: Los usuarios pueden actualizar sus propios proyectos.
CREATE POLICY "Authenticated users can update projects"
ON projects FOR UPDATE
USING ( public.is_super_admin() OR (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) );


-- Creamos la tabla para las secciones de documentos de cada proyecto
CREATE TABLE project_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitamos RLS
ALTER TABLE project_sections ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver las secciones de los proyectos de su compañía.
CREATE POLICY "Authenticated users can view project sections"
ON project_sections FOR SELECT
USING ( public.is_super_admin() OR (auth.uid() IS NOT NULL AND project_id IN (SELECT id FROM projects WHERE company_id = public.get_my_company_id())) );

-- Política: Los usuarios pueden crear secciones.
CREATE POLICY "Authenticated users can create project sections"
ON project_sections FOR INSERT
WITH CHECK ( public.is_super_admin() OR (auth.uid() IS NOT NULL AND project_id IN (SELECT id FROM projects WHERE company_id = public.get_my_company_id())) );


-- Creamos la tabla para los documentos
CREATE TABLE project_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES project_sections(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE, -- Denormalized for easier lookups
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitamos RLS
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver documentos de los proyectos de su compañía.
CREATE POLICY "Authenticated users can view project documents"
ON project_documents FOR SELECT
USING ( public.is_super_admin() OR (auth.uid() IS NOT NULL AND project_id IN (SELECT id FROM projects WHERE company_id = public.get_my_company_id())) );

-- Política: Los usuarios pueden subir documentos.
CREATE POLICY "Authenticated users can upload documents"
ON project_documents FOR INSERT
WITH CHECK ( public.is_super_admin() OR (auth.uid() IS NOT NULL AND project_id IN (SELECT id FROM projects WHERE company_id = public.get_my_company_id())) ); 