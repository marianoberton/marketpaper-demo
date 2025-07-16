-- =============================================
-- SCRIPT PARA AGREGAR TABLA chatbot_messages
-- =============================================
-- Ejecutar en Supabase SQL Editor después del script principal
-- Fecha: 2024

-- =============================================
-- CREAR TABLA: chatbot_messages
-- =============================================

CREATE TABLE IF NOT EXISTS chatbot_messages (
    id BIGSERIAL PRIMARY KEY,
    wa_id TEXT NOT NULL,
    company_id UUID NOT NULL,
    message_id TEXT NOT NULL UNIQUE, -- ID único del mensaje de WhatsApp
    conversation_id TEXT, -- ID de la conversación (para agrupar mensajes)
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')), -- Dirección del mensaje
    message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document', 'location', 'contact', 'interactive', 'template', 'reaction', 'system')), -- Tipo de mensaje
    content JSONB NOT NULL, -- Contenido del mensaje (estructura flexible)
    raw_message JSONB, -- Mensaje crudo de WhatsApp (para debugging)
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')), -- Estado del mensaje
    message_timestamp TIMESTAMPTZ NOT NULL, -- Timestamp del mensaje (de WhatsApp)
    processed_at TIMESTAMPTZ DEFAULT NOW(), -- Cuando se procesó en nuestro sistema
    is_automated BOOLEAN DEFAULT false, -- Si fue respuesta automática del bot
    context_data JSONB DEFAULT '{}', -- Datos de contexto adicionales
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (wa_id, company_id) REFERENCES chatbot_contacts(wa_id, company_id) ON DELETE CASCADE
);

-- Comentarios para documentación
COMMENT ON TABLE chatbot_messages IS 'Almacena historial completo de mensajes de WhatsApp por empresa';
COMMENT ON COLUMN chatbot_messages.wa_id IS 'Número de WhatsApp del contacto';
COMMENT ON COLUMN chatbot_messages.company_id IS 'ID de la empresa';
COMMENT ON COLUMN chatbot_messages.message_id IS 'ID único del mensaje de WhatsApp';
COMMENT ON COLUMN chatbot_messages.conversation_id IS 'ID de conversación para agrupar mensajes relacionados';
COMMENT ON COLUMN chatbot_messages.direction IS 'Dirección: inbound (recibido) o outbound (enviado)';
COMMENT ON COLUMN chatbot_messages.message_type IS 'Tipo de mensaje: text, image, audio, video, document, etc.';
COMMENT ON COLUMN chatbot_messages.content IS 'Contenido estructurado del mensaje (JSON)';
COMMENT ON COLUMN chatbot_messages.raw_message IS 'Mensaje original de WhatsApp API (para debugging)';
COMMENT ON COLUMN chatbot_messages.status IS 'Estado del mensaje: pending, sent, delivered, read, failed';
COMMENT ON COLUMN chatbot_messages.message_timestamp IS 'Timestamp original del mensaje de WhatsApp';
COMMENT ON COLUMN chatbot_messages.processed_at IS 'Cuando se procesó en nuestro sistema';
COMMENT ON COLUMN chatbot_messages.is_automated IS 'Si fue respuesta automática del chatbot';
COMMENT ON COLUMN chatbot_messages.context_data IS 'Datos adicionales de contexto (JSON)';

-- =============================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CREAR POLÍTICAS RLS PARA chatbot_messages
-- =============================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view their company chatbot messages" ON chatbot_messages;
DROP POLICY IF EXISTS "Users can create chatbot messages for their company" ON chatbot_messages;
DROP POLICY IF EXISTS "Users can update their company chatbot messages" ON chatbot_messages;
DROP POLICY IF EXISTS "Users can delete their company chatbot messages" ON chatbot_messages;

-- Política SELECT: Usuarios ven solo mensajes de su empresa
CREATE POLICY "Users can view their company chatbot messages"
ON chatbot_messages FOR SELECT
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

-- Política INSERT: Usuarios crean solo mensajes para su empresa
CREATE POLICY "Users can create chatbot messages for their company"
ON chatbot_messages FOR INSERT
WITH CHECK (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

-- Política UPDATE: Usuarios actualizan solo mensajes de su empresa
CREATE POLICY "Users can update their company chatbot messages"
ON chatbot_messages FOR UPDATE
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

-- Política DELETE: Usuarios eliminan solo mensajes de su empresa
CREATE POLICY "Users can delete their company chatbot messages"
ON chatbot_messages FOR DELETE
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

-- =============================================
-- CREAR ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices para chatbot_messages
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_company_id ON chatbot_messages(company_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_wa_id_company_id ON chatbot_messages(wa_id, company_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_message_id ON chatbot_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation_id ON chatbot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_direction ON chatbot_messages(direction);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_message_type ON chatbot_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_timestamp ON chatbot_messages(message_timestamp);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_processed_at ON chatbot_messages(processed_at);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_status ON chatbot_messages(status);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_is_automated ON chatbot_messages(is_automated);

-- Índice compuesto para consultas de conversación
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation_timestamp ON chatbot_messages(conversation_id, message_timestamp);

-- =============================================
-- TRIGGERS PARA AUTOMATIZACIÓN
-- =============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_chatbot_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_chatbot_messages_updated_at ON chatbot_messages;
CREATE TRIGGER trigger_update_chatbot_messages_updated_at
    BEFORE UPDATE ON chatbot_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chatbot_messages_updated_at();

-- =============================================
-- FUNCIONES ÚTILES PARA CONSULTAS
-- =============================================

-- Función para obtener conversación completa
CREATE OR REPLACE FUNCTION get_conversation_messages(
    p_conversation_id TEXT,
    p_company_id UUID,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id BIGINT,
    message_id TEXT,
    direction TEXT,
    message_type TEXT,
    content JSONB,
    message_timestamp TIMESTAMPTZ,
    is_automated BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.message_id,
        m.direction,
        m.message_type,
        m.content,
        m.message_timestamp,
        m.is_automated
    FROM chatbot_messages m
    WHERE m.conversation_id = p_conversation_id
    AND m.company_id = p_company_id
    ORDER BY m.message_timestamp DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener últimos mensajes de un contacto
CREATE OR REPLACE FUNCTION get_contact_recent_messages(
    p_wa_id TEXT,
    p_company_id UUID,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id BIGINT,
    message_id TEXT,
    conversation_id TEXT,
    direction TEXT,
    message_type TEXT,
    content JSONB,
    message_timestamp TIMESTAMPTZ,
    is_automated BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.message_id,
        m.conversation_id,
        m.direction,
        m.message_type,
        m.content,
        m.message_timestamp,
        m.is_automated
    FROM chatbot_messages m
    WHERE m.wa_id = p_wa_id
    AND m.company_id = p_company_id
    ORDER BY m.message_timestamp DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- EJEMPLOS DE ESTRUCTURA DE DATOS
-- =============================================

/*
-- Ejemplo de mensaje de texto inbound:
{
  "text": "Hola, quisiera información sobre sus servicios"
}

-- Ejemplo de mensaje de imagen inbound:
{
  "image": {
    "id": "media_id_123",
    "mime_type": "image/jpeg",
    "sha256": "hash_value",
    "caption": "Esta es una imagen"
  }
}

-- Ejemplo de mensaje de texto outbound:
{
  "text": "¡Hola! Gracias por contactarnos. ¿En qué podemos ayudarte?"
}

-- Ejemplo de mensaje interactivo (botones):
{
  "interactive": {
    "type": "button",
    "body": {
      "text": "¿Qué información necesitas?"
    },
    "action": {
      "buttons": [
        {"id": "btn_1", "title": "Precios"},
        {"id": "btn_2", "title": "Horarios"},
        {"id": "btn_3", "title": "Ubicación"}
      ]
    }
  }
}
*/

-- =============================================
-- DATOS DE EJEMPLO (OPCIONAL - COMENTADO)
-- =============================================

/*
-- Insertar mensaje de ejemplo (descomentar para testing)
INSERT INTO chatbot_messages (
    wa_id,
    company_id,
    message_id,
    conversation_id,
    direction,
    message_type,
    content,
    message_timestamp,
    is_automated
) VALUES (
    '5491112345678',
    (SELECT id FROM companies LIMIT 1),
    'wamid_example_123',
    'conv_123456',
    'inbound',
    'text',
    '{"text": "Hola, quisiera información sobre sus servicios"}',
    NOW() - INTERVAL '5 minutes',
    false
), (
    '5491112345678',
    (SELECT id FROM companies LIMIT 1),
    'wamid_example_124',
    'conv_123456',
    'outbound',
    'text',
    '{"text": "¡Hola! Gracias por contactarnos. ¿En qué podemos ayudarte?"}',
    NOW() - INTERVAL '4 minutes',
    true
);
*/

-- =============================================
-- VERIFICAR CREACIÓN EXITOSA
-- =============================================

-- Mostrar información de la tabla creada
SELECT 
    'chatbot_messages' as table_name,
    COUNT(*) as total_records
FROM chatbot_messages;

-- Mostrar políticas RLS creadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'chatbot_messages'
ORDER BY policyname;

-- Mostrar índices creados
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename = 'chatbot_messages'
AND schemaname = 'public'
ORDER BY indexname;

-- =============================================
-- SCRIPT COMPLETADO EXITOSAMENTE
-- =============================================

SELECT 'Tabla chatbot_messages creada exitosamente! ✅' as status; 