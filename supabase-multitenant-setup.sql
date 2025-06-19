-- =============================================
-- FOMO CRM - Multi-Tenant Supabase Setup
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- COMPANIES TABLE (TENANTS)
-- =============================================
CREATE TABLE companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Información básica
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier
    domain VARCHAR(255), -- Custom domain if needed
    
    -- Configuración
    settings JSONB DEFAULT '{}',
    features TEXT[] DEFAULT ARRAY['crm', 'analytics', 'automation'],
    
    -- Plan y límites
    plan VARCHAR(50) DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise')),
    max_users INTEGER DEFAULT 5,
    max_contacts INTEGER DEFAULT 1000,
    
    -- Estado
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
    
    -- Metadatos
    logo_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'es-ES',
    
    -- Facturación
    billing_email VARCHAR(255),
    subscription_id VARCHAR(255),
    trial_ends_at TIMESTAMP WITH TIME ZONE
);

-- Índices para companies
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_plan ON companies(plan);

-- =============================================
-- USERS TABLE (ACTUALIZADA PARA MULTI-TENANT)
-- =============================================
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Información básica
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    
    -- Multi-tenant
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Rol y permisos
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
    permissions TEXT[] DEFAULT ARRAY['read'],
    
    -- Estado
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Configuración personal
    preferences JSONB DEFAULT '{}',
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'es-ES'
);

-- Índices para user_profiles
CREATE INDEX idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- =============================================
-- ACTUALIZAR TABLAS CRM CON COMPANY_ID
-- =============================================

-- Leads table (actualizada)
DROP TABLE IF EXISTS leads CASCADE;
CREATE TABLE leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Multi-tenant
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
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
    assigned_to UUID REFERENCES user_profiles(id),
    last_contact TIMESTAMP WITH TIME ZONE,
    next_follow_up TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    
    -- Metadatos específicos
    meta_lead_id VARCHAR(255),
    form_id VARCHAR(255),
    page_id VARCHAR(255)
);

-- Contacts table (actualizada)
DROP TABLE IF EXISTS contacts CASCADE;
CREATE TABLE contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Multi-tenant
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
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
    assigned_to UUID REFERENCES user_profiles(id),
    
    -- Metadatos
    tags TEXT[],
    notes TEXT,
    last_interaction TIMESTAMP WITH TIME ZONE
);

-- Activities table (actualizada)
DROP TABLE IF EXISTS activities CASCADE;
CREATE TABLE activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Multi-tenant
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Relaciones
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    user_id UUID REFERENCES user_profiles(id),
    
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
    duration INTEGER,
    
    -- Gestión
    assigned_to UUID REFERENCES user_profiles(id),
    attachments TEXT[],
    
    -- Metadatos específicos
    whatsapp_message_id VARCHAR(255),
    meta_data JSONB
);

-- Pipeline table (actualizada)
DROP TABLE IF EXISTS pipeline CASCADE;
CREATE TABLE pipeline (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Multi-tenant
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
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
    assigned_to UUID REFERENCES user_profiles(id)
);

-- Campaigns table (actualizada)
DROP TABLE IF EXISTS campaigns CASCADE;
CREATE TABLE campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Multi-tenant
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
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
    
    -- Gestión
    created_by UUID REFERENCES user_profiles(id),
    assigned_to UUID REFERENCES user_profiles(id),
    
    -- Metadatos
    meta_data JSONB
);

-- =============================================
-- ÍNDICES OPTIMIZADOS PARA MULTI-TENANT
-- =============================================

-- Leads
CREATE INDEX idx_leads_company_id ON leads(company_id);
CREATE INDEX idx_leads_company_email ON leads(company_id, email);
CREATE INDEX idx_leads_company_source ON leads(company_id, source);
CREATE INDEX idx_leads_company_temperature ON leads(company_id, temperature);
CREATE INDEX idx_leads_company_status ON leads(company_id, status);
CREATE INDEX idx_leads_company_created_at ON leads(company_id, created_at);

-- Contacts
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_company_email ON contacts(company_id, email);
CREATE INDEX idx_contacts_company_status ON contacts(company_id, status);

-- Activities
CREATE INDEX idx_activities_company_id ON activities(company_id);
CREATE INDEX idx_activities_company_contact ON activities(company_id, contact_id);
CREATE INDEX idx_activities_company_type ON activities(company_id, type);

-- Pipeline
CREATE INDEX idx_pipeline_company_id ON pipeline(company_id);
CREATE INDEX idx_pipeline_company_stage ON pipeline(company_id, stage);

-- Campaigns
CREATE INDEX idx_campaigns_company_id ON campaigns(company_id);
CREATE INDEX idx_campaigns_company_status ON campaigns(company_id, status);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS PARA COMPANIES
-- =============================================

-- Los usuarios solo pueden ver su propia empresa
CREATE POLICY "Users can view own company" ON companies
    FOR SELECT USING (
        id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Solo owners pueden actualizar la empresa
CREATE POLICY "Only owners can update company" ON companies
    FOR UPDATE USING (
        id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- =============================================
-- POLÍTICAS RLS PARA USER_PROFILES
-- =============================================

-- Los usuarios pueden ver otros usuarios de su empresa
CREATE POLICY "Users can view company members" ON user_profiles
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

-- Solo admins pueden insertar nuevos usuarios
CREATE POLICY "Admins can insert users" ON user_profiles
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- =============================================
-- POLÍTICAS RLS PARA LEADS
-- =============================================

CREATE POLICY "Users can view company leads" ON leads
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert company leads" ON leads
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update company leads" ON leads
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete company leads" ON leads
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
        )
    );

-- =============================================
-- POLÍTICAS RLS PARA CONTACTS
-- =============================================

CREATE POLICY "Users can view company contacts" ON contacts
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert company contacts" ON contacts
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update company contacts" ON contacts
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete company contacts" ON contacts
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
        )
    );

-- =============================================
-- POLÍTICAS RLS PARA ACTIVITIES
-- =============================================

CREATE POLICY "Users can view company activities" ON activities
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert company activities" ON activities
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update company activities" ON activities
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own activities" ON activities
    FOR DELETE USING (
        user_id = auth.uid() OR
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
        )
    );

-- =============================================
-- POLÍTICAS RLS PARA PIPELINE
-- =============================================

CREATE POLICY "Users can view company pipeline" ON pipeline
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert company pipeline" ON pipeline
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update company pipeline" ON pipeline
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete company pipeline" ON pipeline
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
        )
    );

-- =============================================
-- POLÍTICAS RLS PARA CAMPAIGNS
-- =============================================

CREATE POLICY "Users can view company campaigns" ON campaigns
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert company campaigns" ON campaigns
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update company campaigns" ON campaigns
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete company campaigns" ON campaigns
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
        )
    );

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para todas las tablas
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_updated_at BEFORE UPDATE ON pipeline
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCIONES PARA MULTI-TENANT
-- =============================================

-- Función para obtener company_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT company_id 
        FROM user_profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es admin de la empresa
CREATE OR REPLACE FUNCTION is_company_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear empresa con usuario owner
CREATE OR REPLACE FUNCTION create_company_with_owner(
    company_name TEXT,
    company_slug TEXT,
    owner_email TEXT,
    owner_name TEXT
)
RETURNS UUID AS $$
DECLARE
    new_company_id UUID;
    new_user_id UUID;
BEGIN
    -- Crear empresa
    INSERT INTO companies (name, slug)
    VALUES (company_name, company_slug)
    RETURNING id INTO new_company_id;
    
    -- Crear usuario owner
    INSERT INTO user_profiles (id, email, full_name, company_id, role)
    VALUES (auth.uid(), owner_email, owner_name, new_company_id, 'owner')
    RETURNING id INTO new_user_id;
    
    RETURN new_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- DATOS DE EJEMPLO
-- =============================================

-- Insertar empresa de ejemplo
INSERT INTO companies (name, slug, plan, status) VALUES
('FOMO Demo Company', 'fomo-demo', 'professional', 'active'),
('Acme Corp', 'acme-corp', 'starter', 'active');

-- Insertar usuarios de ejemplo (requiere que existan en auth.users)
-- INSERT INTO user_profiles (id, email, full_name, company_id, role) VALUES
-- ('user-uuid-1', 'admin@fomo-demo.com', 'Admin FOMO', (SELECT id FROM companies WHERE slug = 'fomo-demo'), 'owner'),
-- ('user-uuid-2', 'user@fomo-demo.com', 'Usuario FOMO', (SELECT id FROM companies WHERE slug = 'fomo-demo'), 'member');

-- =============================================
-- COMENTARIOS FINALES
-- =============================================

-- Este script configura:
-- 1. Arquitectura multi-tenant completa
-- 2. Aislamiento total de datos por empresa
-- 3. RLS policies granulares por rol
-- 4. Índices optimizados para consultas multi-tenant
-- 5. Funciones auxiliares para gestión de empresas
-- 6. Triggers automáticos para timestamps

-- Para usar:
-- 1. Ejecuta este script en Supabase SQL Editor
-- 2. Configura Auth hooks para crear user_profiles automáticamente
-- 3. Implementa el frontend con el contexto de empresa
-- 4. Usa las funciones auxiliares para operaciones multi-tenant