-- =============================================
-- VERSIÓN SIMPLE DE message_buffer (Sin Multi-tenant)
-- =============================================
-- ADVERTENCIA: Esta versión NO es multi-tenant
-- Solo usar si manejas UNA empresa

-- Crear la tabla message_buffer (versión simple)
CREATE TABLE IF NOT EXISTS message_buffer (
    phone_number VARCHAR(20) PRIMARY KEY,
    messages TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),  -- Mejorado: con timezone
    updated_at TIMESTAMPTZ DEFAULT NOW()   -- Mejorado: con timezone
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_message_buffer_phone ON message_buffer(phone_number);
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

-- Comentarios
COMMENT ON TABLE message_buffer IS 'Buffer de mensajes simple (sin multi-tenancy)';
COMMENT ON COLUMN message_buffer.phone_number IS 'Número de teléfono (máximo 20 caracteres)';
COMMENT ON COLUMN message_buffer.messages IS 'Mensajes concatenados';

-- Verificar creación
SELECT 'message_buffer simple creado exitosamente! ⚠️  (Sin multi-tenancy)' as status; 