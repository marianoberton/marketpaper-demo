-- =====================================================
-- SISTEMA DE TICKETS DE SOPORTE
-- =====================================================
-- Este script crea las tablas necesarias para el sistema
-- de tickets de soporte multi-tenant
-- =====================================================

-- Tabla de categorías de tickets (configurable)
CREATE TABLE IF NOT EXISTS ticket_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#6B7280', -- Color para UI
    icon TEXT DEFAULT 'help-circle', -- Icono lucide
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar categorías iniciales
INSERT INTO ticket_categories (name, description, color, icon, sort_order) VALUES
    ('Técnico', 'Problemas técnicos con la plataforma', '#EF4444', 'wrench', 1),
    ('Consulta General', 'Preguntas generales sobre el uso', '#3B82F6', 'help-circle', 2),
    ('Solicitud de Mejora', 'Sugerencias y nuevas funcionalidades', '#10B981', 'lightbulb', 3),
    ('Bug Report', 'Reporte de errores o bugs', '#F59E0B', 'bug', 4)
ON CONFLICT (name) DO NOTHING;

-- Tabla principal de tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relación con empresa (opcional - puede ser ticket externo)
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    
    -- Usuario que crea el ticket (opcional - puede ser externo)
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Para tickets externos (usuarios sin cuenta)
    external_name TEXT,
    external_email TEXT,
    external_company TEXT, -- Empresa del usuario externo
    external_phone TEXT,
    
    -- Contenido del ticket
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Categoría del ticket
    category_id UUID REFERENCES ticket_categories(id) ON DELETE SET NULL,
    
    -- Estado y prioridad
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Metadatos
    source TEXT DEFAULT 'platform' CHECK (source IN ('platform', 'external_form', 'email', 'slack')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    
    -- Tracking
    last_response_at TIMESTAMPTZ,
    last_response_by TEXT, -- 'user' o 'admin'
    
    -- Notificación
    slack_notified BOOLEAN DEFAULT false,
    slack_thread_ts TEXT -- ID del thread en Slack para respuestas
);

-- Tabla de mensajes/respuestas
CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    
    -- Quien envía el mensaje
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin', 'external', 'system')),
    sender_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    sender_name TEXT NOT NULL,
    sender_email TEXT,
    
    -- Contenido
    message TEXT NOT NULL,
    
    -- Metadatos
    is_internal BOOLEAN DEFAULT false, -- Notas internas solo visibles para admin
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para archivos adjuntos (opcional, para futuro)
CREATE TABLE IF NOT EXISTS ticket_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    message_id UUID REFERENCES ticket_messages(id) ON DELETE CASCADE,
    
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    
    uploaded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_support_tickets_company ON support_tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_external_email ON support_tickets(external_email);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created ON ticket_messages(created_at);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_support_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_support_ticket_timestamp ON support_tickets;
CREATE TRIGGER trigger_update_support_ticket_timestamp
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_support_ticket_timestamp();

-- Trigger para actualizar last_response
CREATE OR REPLACE FUNCTION update_ticket_last_response()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE support_tickets
    SET 
        last_response_at = NEW.created_at,
        last_response_by = NEW.sender_type,
        updated_at = NOW()
    WHERE id = NEW.ticket_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ticket_last_response ON ticket_messages;
CREATE TRIGGER trigger_update_ticket_last_response
    AFTER INSERT ON ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_last_response();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;

-- Políticas para ticket_categories (lectura pública, escritura solo admin)
DROP POLICY IF EXISTS "Anyone can read active categories" ON ticket_categories;
CREATE POLICY "Anyone can read active categories"
    ON ticket_categories FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Super admins can manage categories" ON ticket_categories;
CREATE POLICY "Super admins can manage categories"
    ON ticket_categories FOR ALL
    USING (
        is_super_admin()
    );

-- Políticas para support_tickets
-- Los usuarios pueden ver sus propios tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
CREATE POLICY "Users can view own tickets"
    ON support_tickets FOR SELECT
    USING (
        user_id = auth.uid()
        OR 
        -- Usuarios de la misma empresa pueden ver tickets de la empresa
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.company_id = support_tickets.company_id
        )
    );

-- Los usuarios pueden crear tickets
DROP POLICY IF EXISTS "Authenticated users can create tickets" ON support_tickets;
CREATE POLICY "Authenticated users can create tickets"
    ON support_tickets FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Super admins pueden ver y gestionar todos los tickets
DROP POLICY IF EXISTS "Super admins can manage all tickets" ON support_tickets;
CREATE POLICY "Super admins can manage all tickets"
    ON support_tickets FOR ALL
    USING (
        is_super_admin()
    );

-- Política para permitir inserción de tickets externos (sin auth)
-- Esto se manejará con service role en el webhook

-- Políticas para ticket_messages
DROP POLICY IF EXISTS "Users can view messages of their tickets" ON ticket_messages;
CREATE POLICY "Users can view messages of their tickets"
    ON ticket_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE support_tickets.id = ticket_messages.ticket_id
            AND (
                support_tickets.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE user_profiles.id = auth.uid()
                    AND user_profiles.company_id = support_tickets.company_id
                )
            )
        )
        AND is_internal = false
    );

DROP POLICY IF EXISTS "Users can add messages to their tickets" ON ticket_messages;
CREATE POLICY "Users can add messages to their tickets"
    ON ticket_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE support_tickets.id = ticket_messages.ticket_id
            AND (
                support_tickets.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE user_profiles.id = auth.uid()
                    AND user_profiles.company_id = support_tickets.company_id
                )
            )
        )
    );

DROP POLICY IF EXISTS "Super admins can manage all messages" ON ticket_messages;
CREATE POLICY "Super admins can manage all messages"
    ON ticket_messages FOR ALL
    USING (
        is_super_admin()
    );

-- Políticas para attachments
DROP POLICY IF EXISTS "Users can view attachments of their tickets" ON ticket_attachments;
CREATE POLICY "Users can view attachments of their tickets"
    ON ticket_attachments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE support_tickets.id = ticket_attachments.ticket_id
            AND (
                support_tickets.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE user_profiles.id = auth.uid()
                    AND user_profiles.company_id = support_tickets.company_id
                )
            )
        )
    );

DROP POLICY IF EXISTS "Super admins can manage all attachments" ON ticket_attachments;
CREATE POLICY "Super admins can manage all attachments"
    ON ticket_attachments FOR ALL
    USING (
        is_super_admin()
    );

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para estadísticas de tickets (solo super admin)
CREATE OR REPLACE VIEW ticket_stats AS
SELECT
    COUNT(*) FILTER (WHERE status = 'open') as open_count,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
    COUNT(*) FILTER (WHERE status = 'waiting_user') as waiting_user_count,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
    COUNT(*) FILTER (WHERE status = 'closed') as closed_count,
    COUNT(*) FILTER (WHERE priority = 'urgent' AND status NOT IN ('resolved', 'closed')) as urgent_pending,
    COUNT(*) FILTER (WHERE priority = 'high' AND status NOT IN ('resolved', 'closed')) as high_priority_pending,
    COUNT(*) as total_tickets,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_today,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_this_week
FROM support_tickets;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE support_tickets IS 'Tickets de soporte del sistema';
COMMENT ON TABLE ticket_messages IS 'Mensajes/respuestas de los tickets';
COMMENT ON TABLE ticket_categories IS 'Categorías configurables de tickets';
COMMENT ON TABLE ticket_attachments IS 'Archivos adjuntos a tickets';

COMMENT ON COLUMN support_tickets.external_company IS 'Empresa del usuario externo (para usuarios sin cuenta en la plataforma)';
COMMENT ON COLUMN support_tickets.slack_thread_ts IS 'Thread ID de Slack para mantener conversación sincronizada';
COMMENT ON COLUMN ticket_messages.is_internal IS 'Notas internas solo visibles para administradores';
