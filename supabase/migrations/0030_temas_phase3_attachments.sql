-- =====================================================
-- MÓDULO DE TEMAS - FASE 3
-- =====================================================
-- Extensión: Archivos adjuntos y cliente asociado
-- =====================================================

-- =====================================================
-- 1. TABLA DE ARCHIVOS ADJUNTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS tema_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tema_id UUID NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
    
    -- Información del archivo
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    
    -- Metadatos
    description TEXT,
    uploaded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CAMPO CLIENTE/EMPRESA ASOCIADA EN TEMAS
-- =====================================================

-- Agregar campo client_id para trazabilidad comercial (referencia a clients, no companies)
ALTER TABLE temas ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE temas ADD COLUMN IF NOT EXISTS client_contact TEXT; -- Nombre del contacto

-- =====================================================
-- 3. TABLA COMENTARIOS (separada de activity para mejor UX)
-- =====================================================

CREATE TABLE IF NOT EXISTS tema_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tema_id UUID NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
    
    -- Contenido
    content TEXT NOT NULL,
    
    -- Menciones
    mentioned_users UUID[],
    
    -- Auditoría
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tema_attachments_tema ON tema_attachments(tema_id);
CREATE INDEX IF NOT EXISTS idx_tema_comments_tema ON tema_comments(tema_id);
CREATE INDEX IF NOT EXISTS idx_tema_comments_created ON tema_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_temas_client ON temas(client_id);

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- Trigger para updated_at en tema_comments
DROP TRIGGER IF EXISTS trigger_update_tema_comment_timestamp ON tema_comments;
CREATE TRIGGER trigger_update_tema_comment_timestamp
    BEFORE UPDATE ON tema_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_tema_timestamp();

-- =====================================================
-- 6. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE tema_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tema_comments ENABLE ROW LEVEL SECURITY;

-- Políticas para tema_attachments
DROP POLICY IF EXISTS "Users can view attachments for their temas" ON tema_attachments;
CREATE POLICY "Users can view attachments for their temas"
    ON tema_attachments FOR SELECT
    USING (
        is_super_admin() OR
        EXISTS (
            SELECT 1 FROM temas
            WHERE temas.id = tema_attachments.tema_id
            AND temas.company_id = get_my_company_id()
        )
    );

DROP POLICY IF EXISTS "Users can manage attachments for their temas" ON tema_attachments;
CREATE POLICY "Users can manage attachments for their temas"
    ON tema_attachments FOR ALL
    USING (
        is_super_admin() OR
        EXISTS (
            SELECT 1 FROM temas
            WHERE temas.id = tema_attachments.tema_id
            AND temas.company_id = get_my_company_id()
        )
    );

-- Políticas para tema_comments
DROP POLICY IF EXISTS "Users can view comments for their temas" ON tema_comments;
CREATE POLICY "Users can view comments for their temas"
    ON tema_comments FOR SELECT
    USING (
        is_super_admin() OR
        EXISTS (
            SELECT 1 FROM temas
            WHERE temas.id = tema_comments.tema_id
            AND temas.company_id = get_my_company_id()
        )
    );

DROP POLICY IF EXISTS "Users can create comments for their temas" ON tema_comments;
CREATE POLICY "Users can create comments for their temas"
    ON tema_comments FOR INSERT
    WITH CHECK (
        is_super_admin() OR
        EXISTS (
            SELECT 1 FROM temas
            WHERE temas.id = tema_comments.tema_id
            AND temas.company_id = get_my_company_id()
        )
    );

DROP POLICY IF EXISTS "Users can update their own comments" ON tema_comments;
CREATE POLICY "Users can update their own comments"
    ON tema_comments FOR UPDATE
    USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own comments" ON tema_comments;
CREATE POLICY "Users can delete their own comments"
    ON tema_comments FOR DELETE
    USING (created_by = auth.uid());

-- =====================================================
-- 7. COMENTARIOS
-- =====================================================

COMMENT ON TABLE tema_attachments IS 'Archivos adjuntos de un tema';
COMMENT ON TABLE tema_comments IS 'Comentarios en temas (separado del historial de actividad)';
COMMENT ON COLUMN temas.client_id IS 'Cliente/empresa externa asociada al tema para trazabilidad comercial';
COMMENT ON COLUMN temas.client_contact IS 'Nombre del contacto del cliente';
