-- =============================================
-- FOMO CRM - Supabase Database Setup
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- LEADS TABLE
-- =============================================
CREATE TABLE leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Información básica
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    message TEXT,
    
    -- Fuente y tracking
    source VARCHAR(50) NOT NULL CHECK (source IN (
        'web-form', 'facebook-ads', 'instagram-ads', 'linkedin-organic', 
        'google-ads', 'referral', 'whatsapp', 'cold-outreach'
    )),
    utm_source VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_content VARCHAR(255),
    page_url TEXT,
    
    -- Calificación y estado
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    temperature VARCHAR(10) NOT NULL CHECK (temperature IN ('hot', 'warm', 'cold')),
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN (
        'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'
    )),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    
    -- Gestión
    assigned_to VARCHAR(255),
    last_contact TIMESTAMP WITH TIME ZONE,
    next_follow_up TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    
    -- Metadatos específicos
    meta_lead_id VARCHAR(255), -- Para Facebook/Instagram Lead Ads
    form_id VARCHAR(255),      -- ID del formulario
    page_id VARCHAR(255)       -- ID de la página de Facebook/Instagram
);

-- Índices para leads
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_temperature ON leads(temperature);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);

-- =============================================
-- CONTACTS TABLE
-- =============================================
CREATE TABLE contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Información básica
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    position VARCHAR(255),
    
    -- Clasificación
    source VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'prospect', 'customer', 'inactive')),
    
    -- Relaciones
    lead_id UUID REFERENCES leads(id),
    
    -- Metadatos
    tags TEXT[], -- Array de tags
    notes TEXT,
    last_interaction TIMESTAMP WITH TIME ZONE
);

-- Índices para contacts
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_source ON contacts(source);
CREATE INDEX idx_contacts_lead_id ON contacts(lead_id);

-- =============================================
-- ACTIVITIES TABLE
-- =============================================
CREATE TABLE activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Relaciones
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    
    -- Información de la actividad
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'phone', 'meeting', 'whatsapp', 'task', 'note', 'social')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    subject VARCHAR(500),
    content TEXT NOT NULL,
    
    -- Estado y prioridad
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'scheduled', 'pending')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    outcome VARCHAR(10) CHECK (outcome IN ('positive', 'negative', 'neutral')),
    
    -- Timing
    scheduled_for TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- en minutos
    
    -- Gestión
    assigned_to VARCHAR(255),
    attachments TEXT[], -- Array de URLs de archivos
    
    -- Metadatos específicos
    whatsapp_message_id VARCHAR(255),
    meta_data JSONB
);

-- Índices para activities
CREATE INDEX idx_activities_contact_id ON activities(contact_id);
CREATE INDEX idx_activities_lead_id ON activities(lead_id);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_created_at ON activities(created_at);
CREATE INDEX idx_activities_scheduled_for ON activities(scheduled_for);

-- =============================================
-- PIPELINE TABLE
-- =============================================
CREATE TABLE pipeline (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Relación con lead
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    
    -- Estado del pipeline
    stage VARCHAR(20) NOT NULL DEFAULT 'leads' CHECK (stage IN (
        'leads', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'
    )),
    
    -- Información financiera
    value DECIMAL(12,2) NOT NULL DEFAULT 0,
    probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
    
    -- Fechas
    expected_close_date DATE,
    actual_close_date DATE,
    
    -- Información adicional
    close_reason TEXT,
    notes TEXT,
    assigned_to VARCHAR(255)
);

-- Índices para pipeline
CREATE INDEX idx_pipeline_lead_id ON pipeline(lead_id);
CREATE INDEX idx_pipeline_stage ON pipeline(stage);
CREATE INDEX idx_pipeline_assigned_to ON pipeline(assigned_to);
CREATE INDEX idx_pipeline_expected_close_date ON pipeline(expected_close_date);

-- =============================================
-- CAMPAIGNS TABLE
-- =============================================
CREATE TABLE campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Información básica
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('facebook', 'instagram', 'linkedin', 'google', 'email', 'whatsapp')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    
    -- Presupuesto y métricas
    budget DECIMAL(10,2) DEFAULT 0,
    spent DECIMAL(10,2) DEFAULT 0,
    leads_generated INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    
    -- Fechas
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- UTM tracking
    utm_campaign VARCHAR(255) NOT NULL,
    utm_source VARCHAR(255) NOT NULL,
    utm_medium VARCHAR(255) NOT NULL,
    
    -- Metadatos
    meta_data JSONB
);

-- Índices para campaigns
CREATE INDEX idx_campaigns_type ON campaigns(type);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_utm_campaign ON campaigns(utm_campaign);
CREATE INDEX idx_campaigns_start_date ON campaigns(start_date);

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_updated_at BEFORE UPDATE ON pipeline
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo por ahora, personalizar según necesidades)
CREATE POLICY "Enable all operations for authenticated users" ON leads
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON contacts
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON activities
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON pipeline
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON campaigns
    FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- FUNCIONES ÚTILES
-- =============================================

-- Función para obtener métricas de leads
CREATE OR REPLACE FUNCTION get_lead_metrics()
RETURNS TABLE (
    total_leads BIGINT,
    hot_leads BIGINT,
    warm_leads BIGINT,
    cold_leads BIGINT,
    this_week_leads BIGINT,
    conversion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE temperature = 'hot') as hot_leads,
        COUNT(*) FILTER (WHERE temperature = 'warm') as warm_leads,
        COUNT(*) FILTER (WHERE temperature = 'cold') as cold_leads,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as this_week_leads,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE status = 'closed-won')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            ELSE 0
        END as conversion_rate
    FROM leads;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener métricas del pipeline
CREATE OR REPLACE FUNCTION get_pipeline_metrics()
RETURNS TABLE (
    total_value NUMERIC,
    total_opportunities BIGINT,
    average_value NUMERIC,
    close_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(value), 0) as total_value,
        COUNT(*) as total_opportunities,
        CASE 
            WHEN COUNT(*) > 0 THEN ROUND(AVG(value), 2)
            ELSE 0
        END as average_value,
        CASE 
            WHEN COUNT(*) FILTER (WHERE stage IN ('closed-won', 'closed-lost')) > 0 THEN
                ROUND((COUNT(*) FILTER (WHERE stage = 'closed-won')::NUMERIC / 
                       COUNT(*) FILTER (WHERE stage IN ('closed-won', 'closed-lost'))::NUMERIC) * 100, 2)
            ELSE 0
        END as close_rate
    FROM pipeline;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =============================================

-- Insertar algunas campañas de ejemplo
INSERT INTO campaigns (name, type, status, budget, utm_campaign, utm_source, utm_medium, start_date) VALUES
('Lanzamiento Web', 'facebook', 'active', 1000.00, 'web-launch', 'facebook', 'cpc', CURRENT_DATE),
('Instagram Stories', 'instagram', 'active', 800.00, 'stories-promo', 'instagram', 'cpc', CURRENT_DATE),
('LinkedIn Orgánico', 'linkedin', 'active', 0.00, 'organic-content', 'linkedin', 'organic', CURRENT_DATE);

-- =============================================
-- COMENTARIOS FINALES
-- =============================================

-- Este script configura una base de datos CRM completa en Supabase con:
-- 1. Tablas para leads, contactos, actividades, pipeline y campañas
-- 2. Índices optimizados para consultas frecuentes
-- 3. Triggers para actualización automática de timestamps
-- 4. Row Level Security habilitado
-- 5. Funciones útiles para métricas
-- 6. Constraints para integridad de datos

-- Para ejecutar:
-- 1. Copia este script en el SQL Editor de Supabase
-- 2. Ejecuta todo el script
-- 3. Verifica que todas las tablas se crearon correctamente
-- 4. Configura las variables de entorno en tu aplicación