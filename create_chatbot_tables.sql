-- =============================================
-- SCRIPT PARA CREAR MÓDULO CHATBOT WHATSAPP
-- =============================================
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2024

-- =============================================
-- VERIFICAR Y CREAR FUNCIONES NECESARIAS
-- =============================================

-- Función para verificar si es super admin (si no existe)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM user_profiles WHERE id = auth.uid();
  RETURN COALESCE(user_role = 'super_admin', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener company_id del usuario actual (si no existe)
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID AS $$
DECLARE
  user_company_id UUID;
BEGIN
  SELECT company_id INTO user_company_id FROM user_profiles WHERE id = auth.uid();
  RETURN user_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- CREAR TABLA: chatbot_contacts
-- =============================================

-- Eliminar tabla si existe (solo para desarrollo/testing)
-- DROP TABLE IF EXISTS chatbot_contacts CASCADE;

CREATE TABLE IF NOT EXISTS chatbot_contacts (
    wa_id TEXT NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (wa_id, company_id)
);

-- Comentarios para documentación
COMMENT ON TABLE chatbot_contacts IS 'Almacena contactos de WhatsApp por empresa (multi-tenant)';
COMMENT ON COLUMN chatbot_contacts.wa_id IS 'Número de WhatsApp del contacto (ej: 5491112345678)';
COMMENT ON COLUMN chatbot_contacts.company_id IS 'ID de la empresa propietaria del contacto';
COMMENT ON COLUMN chatbot_contacts.created_at IS 'Fecha de registro del contacto';
COMMENT ON COLUMN chatbot_contacts.last_seen_at IS 'Última actividad del contacto';

-- =============================================
-- CREAR TABLA: chatbot_analytics
-- =============================================

-- Eliminar tabla si existe (solo para desarrollo/testing)
-- DROP TABLE IF EXISTS chatbot_analytics CASCADE;

CREATE TABLE IF NOT EXISTS chatbot_analytics (
    id BIGSERIAL PRIMARY KEY,
    wa_id TEXT NOT NULL,
    company_id UUID NOT NULL,
    message_id TEXT NOT NULL,
    intent TEXT,
    flow_executed TEXT,
    response_type TEXT,
    response_sent BOOLEAN,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (wa_id, company_id) REFERENCES chatbot_contacts(wa_id, company_id) ON DELETE CASCADE
);

-- Comentarios para documentación
COMMENT ON TABLE chatbot_analytics IS 'Logs analíticos de interacciones del chatbot por empresa';
COMMENT ON COLUMN chatbot_analytics.wa_id IS 'Número de WhatsApp del contacto';
COMMENT ON COLUMN chatbot_analytics.company_id IS 'ID de la empresa';
COMMENT ON COLUMN chatbot_analytics.message_id IS 'ID único del mensaje de WhatsApp';
COMMENT ON COLUMN chatbot_analytics.intent IS 'Intención detectada por IA';
COMMENT ON COLUMN chatbot_analytics.flow_executed IS 'Flujo conversacional ejecutado';
COMMENT ON COLUMN chatbot_analytics.response_type IS 'Tipo de respuesta enviada (text, image, document, etc.)';
COMMENT ON COLUMN chatbot_analytics.response_sent IS 'Si la respuesta se envió exitosamente';
COMMENT ON COLUMN chatbot_analytics.processing_time_ms IS 'Tiempo de procesamiento en milisegundos';

-- =============================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE chatbot_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_analytics ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CREAR POLÍTICAS RLS PARA chatbot_contacts
-- =============================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view their company chatbot contacts" ON chatbot_contacts;
DROP POLICY IF EXISTS "Users can create chatbot contacts for their company" ON chatbot_contacts;
DROP POLICY IF EXISTS "Users can update their company chatbot contacts" ON chatbot_contacts;
DROP POLICY IF EXISTS "Users can delete their company chatbot contacts" ON chatbot_contacts;

-- Política SELECT: Usuarios ven solo contactos de su empresa
CREATE POLICY "Users can view their company chatbot contacts"
ON chatbot_contacts FOR SELECT
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

-- Política INSERT: Usuarios crean solo contactos para su empresa
CREATE POLICY "Users can create chatbot contacts for their company"
ON chatbot_contacts FOR INSERT
WITH CHECK (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

-- Política UPDATE: Usuarios actualizan solo contactos de su empresa
CREATE POLICY "Users can update their company chatbot contacts"
ON chatbot_contacts FOR UPDATE
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

-- Política DELETE: Usuarios eliminan solo contactos de su empresa
CREATE POLICY "Users can delete their company chatbot contacts"
ON chatbot_contacts FOR DELETE
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

-- =============================================
-- CREAR POLÍTICAS RLS PARA chatbot_analytics
-- =============================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view their company chatbot analytics" ON chatbot_analytics;
DROP POLICY IF EXISTS "Users can create chatbot analytics for their company" ON chatbot_analytics;
DROP POLICY IF EXISTS "Users can update their company chatbot analytics" ON chatbot_analytics;
DROP POLICY IF EXISTS "Users can delete their company chatbot analytics" ON chatbot_analytics;

-- Política SELECT: Usuarios ven solo analytics de su empresa
CREATE POLICY "Users can view their company chatbot analytics"
ON chatbot_analytics FOR SELECT
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

-- Política INSERT: Usuarios crean solo analytics para su empresa
CREATE POLICY "Users can create chatbot analytics for their company"
ON chatbot_analytics FOR INSERT
WITH CHECK (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

-- Política UPDATE: Usuarios actualizan solo analytics de su empresa
CREATE POLICY "Users can update their company chatbot analytics"
ON chatbot_analytics FOR UPDATE
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

-- Política DELETE: Usuarios eliminan solo analytics de su empresa
CREATE POLICY "Users can delete their company chatbot analytics"
ON chatbot_analytics FOR DELETE
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

-- =============================================
-- CREAR ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices para chatbot_contacts
CREATE INDEX IF NOT EXISTS idx_chatbot_contacts_company_id ON chatbot_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_contacts_last_seen ON chatbot_contacts(last_seen_at);

-- Índices para chatbot_analytics
CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_company_id ON chatbot_analytics(company_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_wa_id_company_id ON chatbot_analytics(wa_id, company_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_created_at ON chatbot_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_intent ON chatbot_analytics(intent);
CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_response_type ON chatbot_analytics(response_type);

-- =============================================
-- FUNCIONES ÚTILES PARA EL CHATBOT
-- =============================================

-- Función para actualizar last_seen_at automáticamente
CREATE OR REPLACE FUNCTION update_chatbot_contact_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chatbot_contacts 
    SET last_seen_at = NOW()
    WHERE wa_id = NEW.wa_id AND company_id = NEW.company_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar last_seen_at cuando se registra nueva actividad
DROP TRIGGER IF EXISTS trigger_update_last_seen ON chatbot_analytics;
CREATE TRIGGER trigger_update_last_seen
    AFTER INSERT ON chatbot_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_chatbot_contact_last_seen();

-- =============================================
-- DATOS DE EJEMPLO (OPCIONAL - COMENTADO)
-- =============================================

/*
-- Insertar contacto de ejemplo (descomentar para testing)
INSERT INTO chatbot_contacts (wa_id, company_id) 
VALUES ('5491112345678', (SELECT id FROM companies LIMIT 1));

-- Insertar analytics de ejemplo (descomentar para testing)
INSERT INTO chatbot_analytics (
    wa_id, 
    company_id, 
    message_id, 
    intent, 
    flow_executed, 
    response_type, 
    response_sent, 
    processing_time_ms
) VALUES (
    '5491112345678',
    (SELECT id FROM companies LIMIT 1),
    'msg_123456',
    'consultar_precio',
    'precio_servicios',
    'text',
    true,
    1500
);
*/

-- =============================================
-- VERIFICAR CREACIÓN EXITOSA
-- =============================================

-- Mostrar información de las tablas creadas
SELECT 
    'chatbot_contacts' as table_name,
    COUNT(*) as total_records
FROM chatbot_contacts
UNION ALL
SELECT 
    'chatbot_analytics' as table_name,
    COUNT(*) as total_records
FROM chatbot_analytics;

-- Mostrar políticas RLS creadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('chatbot_contacts', 'chatbot_analytics')
ORDER BY tablename, policyname;

-- =============================================
-- SCRIPT COMPLETADO EXITOSAMENTE
-- =============================================

SELECT 'Módulo Chatbot WhatsApp creado exitosamente! ✅' as status; 