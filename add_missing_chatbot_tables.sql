-- =============================================
-- SCRIPT PARA AGREGAR TABLAS FALTANTES DEL CHATBOT
-- =============================================
-- Ejecutar después de los scripts principales
-- Fecha: 2024

-- =============================================
-- TABLA: message_buffer (para concatenar mensajes)
-- =============================================

CREATE TABLE IF NOT EXISTS message_buffer (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wa_id TEXT NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    messages TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (wa_id, company_id) REFERENCES chatbot_contacts(wa_id, company_id) ON DELETE CASCADE
);

-- Comentarios para documentación
COMMENT ON TABLE message_buffer IS 'Buffer para concatenar mensajes de WhatsApp por empresa (reemplaza MongoDB)';
COMMENT ON COLUMN message_buffer.wa_id IS 'Número de WhatsApp del contacto';
COMMENT ON COLUMN message_buffer.company_id IS 'ID de la empresa';
COMMENT ON COLUMN message_buffer.messages IS 'Mensajes concatenados en formato texto';

-- =============================================
-- TABLA: properties (catálogo de productos/propiedades)
-- =============================================

CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    location VARCHAR(255),
    features JSONB DEFAULT '{}',
    image_urls JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved', 'inactive')),
    category VARCHAR(100), -- Categoría del producto/propiedad
    tags TEXT[], -- Tags para búsqueda
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios para documentación
COMMENT ON TABLE properties IS 'Catálogo de propiedades/productos por empresa';
COMMENT ON COLUMN properties.company_id IS 'ID de la empresa propietaria';
COMMENT ON COLUMN properties.name IS 'Nombre del producto/propiedad';
COMMENT ON COLUMN properties.description IS 'Descripción detallada';
COMMENT ON COLUMN properties.price IS 'Precio del producto/propiedad';
COMMENT ON COLUMN properties.location IS 'Ubicación (para propiedades)';
COMMENT ON COLUMN properties.features IS 'Características en formato JSON';
COMMENT ON COLUMN properties.image_urls IS 'URLs de imágenes en formato JSON array';
COMMENT ON COLUMN properties.status IS 'Estado: available, sold, reserved, inactive';
COMMENT ON COLUMN properties.category IS 'Categoría del producto';
COMMENT ON COLUMN properties.tags IS 'Tags para búsqueda y filtrado';

-- =============================================
-- TABLA: chatbot_sessions (para gestión de sesiones)
-- =============================================

CREATE TABLE IF NOT EXISTS chatbot_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wa_id TEXT NOT NULL,
    company_id UUID NOT NULL,
    session_id TEXT NOT NULL,
    current_flow TEXT,
    session_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    FOREIGN KEY (wa_id, company_id) REFERENCES chatbot_contacts(wa_id, company_id) ON DELETE CASCADE
);

-- Comentarios para documentación
COMMENT ON TABLE chatbot_sessions IS 'Sesiones activas del chatbot para mantener contexto';
COMMENT ON COLUMN chatbot_sessions.wa_id IS 'Número de WhatsApp del contacto';
COMMENT ON COLUMN chatbot_sessions.company_id IS 'ID de la empresa';
COMMENT ON COLUMN chatbot_sessions.session_id IS 'ID único de la sesión';
COMMENT ON COLUMN chatbot_sessions.current_flow IS 'Flujo actual en el que se encuentra el usuario';
COMMENT ON COLUMN chatbot_sessions.session_data IS 'Datos de la sesión en formato JSON';
COMMENT ON COLUMN chatbot_sessions.is_active IS 'Si la sesión está activa';
COMMENT ON COLUMN chatbot_sessions.started_at IS 'Cuándo inició la sesión';
COMMENT ON COLUMN chatbot_sessions.last_activity IS 'Última actividad en la sesión';
COMMENT ON COLUMN chatbot_sessions.ended_at IS 'Cuándo terminó la sesión';

-- =============================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE message_buffer ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_sessions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS PARA message_buffer
-- =============================================

CREATE POLICY "Users can view their company message buffer"
ON message_buffer FOR SELECT
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

CREATE POLICY "Users can manage their company message buffer"
ON message_buffer FOR ALL
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

-- =============================================
-- POLÍTICAS RLS PARA properties
-- =============================================

CREATE POLICY "Users can view their company properties"
ON properties FOR SELECT
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

CREATE POLICY "Users can manage their company properties"
ON properties FOR ALL
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

-- =============================================
-- POLÍTICAS RLS PARA chatbot_sessions
-- =============================================

CREATE POLICY "Users can view their company chatbot sessions"
ON chatbot_sessions FOR SELECT
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

CREATE POLICY "Users can manage their company chatbot sessions"
ON chatbot_sessions FOR ALL
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices para message_buffer
CREATE INDEX IF NOT EXISTS idx_message_buffer_company_id ON message_buffer(company_id);
CREATE INDEX IF NOT EXISTS idx_message_buffer_wa_id_company_id ON message_buffer(wa_id, company_id);
CREATE INDEX IF NOT EXISTS idx_message_buffer_updated_at ON message_buffer(updated_at);

-- Índices para properties
CREATE INDEX IF NOT EXISTS idx_properties_company_id ON properties(company_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_category ON properties(category);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_tags ON properties USING GIN(tags);

-- Índices para chatbot_sessions
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_company_id ON chatbot_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_wa_id_company_id ON chatbot_sessions(wa_id, company_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_session_id ON chatbot_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_is_active ON chatbot_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_last_activity ON chatbot_sessions(last_activity);

-- =============================================
-- TRIGGERS PARA AUTOMATIZACIÓN
-- =============================================

-- Función para actualizar updated_at en message_buffer
CREATE OR REPLACE FUNCTION update_message_buffer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para message_buffer
CREATE TRIGGER trigger_update_message_buffer_updated_at
    BEFORE UPDATE ON message_buffer
    FOR EACH ROW
    EXECUTE FUNCTION update_message_buffer_updated_at();

-- Función para actualizar updated_at en properties
CREATE OR REPLACE FUNCTION update_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para properties
CREATE TRIGGER trigger_update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_properties_updated_at();

-- Función para actualizar last_activity en chatbot_sessions
CREATE OR REPLACE FUNCTION update_chatbot_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para chatbot_sessions
CREATE TRIGGER trigger_update_chatbot_session_activity
    BEFORE UPDATE ON chatbot_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_chatbot_session_activity();

-- =============================================
-- FUNCIONES ÚTILES
-- =============================================

-- Función para obtener propiedades disponibles
CREATE OR REPLACE FUNCTION get_available_properties(
    p_company_id UUID,
    p_category VARCHAR(100) DEFAULT NULL,
    p_max_price DECIMAL(10,2) DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id INTEGER,
    name VARCHAR(255),
    description TEXT,
    price DECIMAL(10,2),
    location VARCHAR(255),
    features JSONB,
    image_urls JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.location,
        p.features,
        p.image_urls
    FROM properties p
    WHERE p.company_id = p_company_id
    AND p.status = 'available'
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    ORDER BY p.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener sesión activa
CREATE OR REPLACE FUNCTION get_active_session(
    p_wa_id TEXT,
    p_company_id UUID
)
RETURNS TABLE (
    id UUID,
    session_id TEXT,
    current_flow TEXT,
    session_data JSONB,
    started_at TIMESTAMPTZ,
    last_activity TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.session_id,
        s.current_flow,
        s.session_data,
        s.started_at,
        s.last_activity
    FROM chatbot_sessions s
    WHERE s.wa_id = p_wa_id
    AND s.company_id = p_company_id
    AND s.is_active = true
    ORDER BY s.last_activity DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- DATOS DE EJEMPLO (OPCIONAL - COMENTADO)
-- =============================================

/*
-- Insertar propiedades de ejemplo
INSERT INTO properties (
    company_id, name, description, price, location, features, image_urls, category, tags
) VALUES (
    (SELECT id FROM companies LIMIT 1),
    'Casa en Palermo',
    'Hermosa casa de 3 dormitorios en el corazón de Palermo',
    350000.00,
    'Palermo, CABA',
    '{"bedrooms": 3, "bathrooms": 2, "parking": true, "garden": true}',
    '["https://example.com/image1.jpg", "https://example.com/image2.jpg"]',
    'casa',
    ARRAY['palermo', 'casa', '3dormitorios', 'jardin']
);

-- Insertar buffer de mensajes de ejemplo
INSERT INTO message_buffer (
    wa_id, company_id, messages
) VALUES (
    '5491112345678',
    (SELECT id FROM companies LIMIT 1),
    'Usuario: Hola, busco una casa en Palermo\nBot: ¡Hola! Te ayudo a encontrar propiedades en Palermo. ¿Qué presupuesto tienes?'
);
*/

-- =============================================
-- VERIFICAR CREACIÓN EXITOSA
-- =============================================

-- Mostrar información de las tablas creadas
SELECT 'message_buffer' as table_name, COUNT(*) as total_records FROM message_buffer
UNION ALL
SELECT 'properties' as table_name, COUNT(*) as total_records FROM properties
UNION ALL
SELECT 'chatbot_sessions' as table_name, COUNT(*) as total_records FROM chatbot_sessions;

-- Mostrar políticas RLS creadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('message_buffer', 'properties', 'chatbot_sessions')
ORDER BY tablename, policyname;

-- =============================================
-- SCRIPT COMPLETADO EXITOSAMENTE
-- =============================================

SELECT 'Tablas faltantes del chatbot creadas exitosamente! ✅' as status; 