-- =============================================
-- VERSIÓN HÍBRIDA DE message_buffer
-- =============================================
-- Mantiene tu estructura simple pero preparada para multi-tenancy

-- Crear la tabla message_buffer (versión híbrida)
CREATE TABLE IF NOT EXISTS message_buffer (
    phone_number VARCHAR(20) NOT NULL,
    company_id UUID DEFAULT (SELECT id FROM companies LIMIT 1), -- Default a primera empresa
    messages TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (phone_number, company_id)  -- Clave compuesta
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_message_buffer_phone ON message_buffer(phone_number);
CREATE INDEX IF NOT EXISTS idx_message_buffer_company ON message_buffer(company_id);
CREATE INDEX IF NOT EXISTS idx_message_buffer_updated ON message_buffer(updated_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_message_buffer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_message_buffer_updated_at
    BEFORE UPDATE ON message_buffer
    FOR EACH ROW
    EXECUTE FUNCTION update_message_buffer_updated_at();

-- Vista para mantener compatibilidad con tu código actual
CREATE OR REPLACE VIEW message_buffer_simple AS
SELECT 
    phone_number,
    messages,
    created_at,
    updated_at
FROM message_buffer
WHERE company_id = (SELECT id FROM companies LIMIT 1);

-- Comentarios
COMMENT ON TABLE message_buffer IS 'Buffer de mensajes híbrido (compatible con multi-tenancy)';
COMMENT ON COLUMN message_buffer.phone_number IS 'Número de teléfono';
COMMENT ON COLUMN message_buffer.company_id IS 'ID de la empresa (para futuro multi-tenancy)';
COMMENT ON COLUMN message_buffer.messages IS 'Mensajes concatenados';

-- Verificar creación
SELECT 'message_buffer híbrido creado exitosamente! ✅ (Compatible con ambos enfoques)' as status; 