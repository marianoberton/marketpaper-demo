-- =============================================
-- FOMO CRM - Super Admin Multi-Tenant Setup
-- =============================================

-- =============================================
-- CLEANUP: Drop existing objects to ensure a clean slate
-- =============================================
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_company_id() CASCADE;
DROP FUNCTION IF EXISTS public.log_api_usage(UUID, UUID, VARCHAR, VARCHAR, INTEGER, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS public.check_user_limits(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.reset_monthly_usage() CASCADE;

DROP TABLE IF EXISTS public.cost_alerts CASCADE;
DROP TABLE IF EXISTS public.billing_history CASCADE;
DROP TABLE IF EXISTS public.user_custom_views CASCADE;
DROP TABLE IF EXISTS public.company_dashboard_layouts CASCADE;
DROP TABLE IF EXISTS public.dashboard_components CASCADE;
DROP TABLE IF EXISTS public.daily_usage_stats CASCADE;
DROP TABLE IF EXISTS public.api_usage_logs CASCADE;
DROP TABLE IF EXISTS public.user_api_keys CASCADE;
DROP TABLE IF EXISTS public.company_api_keys CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.client_templates CASCADE;
DROP TABLE IF EXISTS public.super_admins CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- SUPER ADMIN TABLES
-- =============================================

-- Super Admin Users (Platform Administrators)
CREATE TABLE super_admins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Auth reference
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Admin info
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    
    -- Permissions
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'support')),
    permissions TEXT[] DEFAULT ARRAY['manage_clients', 'view_analytics', 'manage_billing'],
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Client Templates (Plantillas de configuración)
CREATE TABLE client_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Template info
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100) DEFAULT 'standard',
    
    -- Configuration
    dashboard_config JSONB DEFAULT '{}',
    workspace_config JSONB DEFAULT '{}',
    available_features TEXT[] DEFAULT ARRAY['crm', 'analytics', 'automation'],
    default_permissions JSONB DEFAULT '{}',
    
    -- Limits
    max_users INTEGER DEFAULT 5,
    max_contacts INTEGER DEFAULT 1000,
    max_api_calls INTEGER DEFAULT 10000,
    
    -- Pricing
    monthly_price DECIMAL(10,2) DEFAULT 0,
    setup_fee DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES super_admins(id)
);

-- =============================================
-- ENHANCED COMPANIES TABLE
-- =============================================

-- Recreate companies table with enhanced features
CREATE TABLE companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    logo_url TEXT,
    
    -- Contact info
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    billing_address JSONB,
    
    -- Configuration
    template_id UUID REFERENCES client_templates(id),
    dashboard_config JSONB DEFAULT '{}',
    workspace_config JSONB DEFAULT '{}',
    custom_branding JSONB DEFAULT '{}',
    
    -- Features & Limits
    features TEXT[] DEFAULT ARRAY['crm', 'analytics', 'automation'],
    plan VARCHAR(50) DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise', 'custom')),
    max_users INTEGER DEFAULT 5,
    max_contacts INTEGER DEFAULT 1000,
    max_api_calls INTEGER DEFAULT 10000,
    
    -- Billing
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    monthly_price DECIMAL(10,2) DEFAULT 0,
    setup_fee DECIMAL(10,2) DEFAULT 0,
    next_billing_date DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'trial')),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'es-ES',
    
    -- Management
    created_by UUID REFERENCES super_admins(id),
    assigned_to UUID REFERENCES super_admins(id)
);

-- =============================================
-- ENHANCED USER PROFILES
-- =============================================

-- Recreate user_profiles with enhanced features
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Basic info
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    
    -- Multi-tenant
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Role & Permissions
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
    custom_permissions JSONB DEFAULT '{}',
    
    -- Dashboard & Workspace customization
    dashboard_config JSONB DEFAULT '{}',
    workspace_config JSONB DEFAULT '{}',
    custom_views JSONB DEFAULT '{}',
    
    -- API Access
    api_access_enabled BOOLEAN DEFAULT false,
    api_rate_limit INTEGER DEFAULT 100, -- requests per hour
    
    -- Usage limits (set by company admin)
    monthly_llm_limit_cost DECIMAL(10,2) DEFAULT 10.00,
    monthly_api_limit_calls INTEGER DEFAULT 1000,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Personal settings
    preferences JSONB DEFAULT '{}',
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'es-ES',
    
    -- Onboarding
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 0
);

-- =============================================
-- SEED DATA: Initial platform data
-- =============================================

INSERT INTO client_templates (name, description, category, dashboard_config, workspace_config, available_features, default_permissions, max_users, max_contacts, max_api_calls, monthly_price, setup_fee, is_active) VALUES
('starter', 'Plan básico para startups y equipos pequeños.', 'standard', '{}', '{}', ARRAY['crm', 'analytics'], '{}', 5, 1000, 10000, 29.00, 0.00, true),
('professional', 'Plan avanzado para empresas en crecimiento.', 'standard', '{"show_profit_margin": true}', '{}', ARRAY['crm', 'analytics', 'automation', 'api_access'], '{}', 25, 5000, 50000, 79.00, 49.00, true),
('enterprise', 'Solución completa para grandes corporaciones.', 'premium', '{"show_profit_margin": true, "custom_analytics": true}', '{}', ARRAY['crm', 'analytics', 'automation', 'api_access', 'sso', 'dedicated_support'], '{}', 100, 25000, 250000, 199.00, 99.00, true);

-- =============================================
-- API KEYS & INTEGRATIONS MANAGEMENT
-- =============================================

-- API Keys per Company
CREATE TABLE company_api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Relations
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES user_profiles(id),
    
    -- API Key info
    service VARCHAR(100) NOT NULL, -- 'openai', 'meta', 'google_analytics', 'whatsapp', etc.
    key_name VARCHAR(255) NOT NULL,
    encrypted_key TEXT NOT NULL, -- Encrypted API key
    
    -- Configuration
    config JSONB DEFAULT '{}', -- Service-specific configuration
    endpoints TEXT[], -- Allowed endpoints
    rate_limits JSONB DEFAULT '{}',
    
    -- Usage tracking
    total_calls INTEGER DEFAULT 0,
    total_cost DECIMAL(12,4) DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    
    -- Limits
    monthly_limit_calls INTEGER,
    monthly_limit_cost DECIMAL(10,2),
    daily_limit_calls INTEGER,
    daily_limit_cost DECIMAL(10,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(company_id, service, key_name)
);

-- User API Keys (Individual user keys for LLM usage)
CREATE TABLE user_api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Relations
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- API Key info
    service VARCHAR(100) NOT NULL, -- 'openai', 'anthropic', 'gemini', etc.
    key_identifier VARCHAR(255) NOT NULL, -- User-friendly identifier
    encrypted_key TEXT NOT NULL,
    
    -- Usage tracking
    total_calls INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(12,4) DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    
    -- Limits (set by company admin)
    monthly_limit_calls INTEGER DEFAULT 1000,
    monthly_limit_tokens INTEGER DEFAULT 100000,
    monthly_limit_cost DECIMAL(10,2) DEFAULT 50.00,
    
    -- Current month usage
    current_month_calls INTEGER DEFAULT 0,
    current_month_tokens INTEGER DEFAULT 0,
    current_month_cost DECIMAL(12,4) DEFAULT 0,
    current_month_reset DATE DEFAULT DATE_TRUNC('month', NOW()),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'over_limit')),
    
    UNIQUE(user_id, service, key_identifier)
);

-- =============================================
-- USAGE TRACKING & ANALYTICS
-- =============================================

-- API Usage Logs
CREATE TABLE api_usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Relations
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    api_key_id UUID REFERENCES company_api_keys(id) ON DELETE SET NULL,
    user_api_key_id UUID REFERENCES user_api_keys(id) ON DELETE SET NULL,
    
    -- Request info
    service VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255),
    method VARCHAR(10),
    
    -- Usage metrics
    tokens_used INTEGER DEFAULT 0,
    cost DECIMAL(12,4) DEFAULT 0,
    response_time INTEGER, -- milliseconds
    
    -- Request/Response data (for debugging)
    request_data JSONB,
    response_data JSONB,
    error_data JSONB,
    
    -- Status
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'error', 'timeout', 'rate_limited')),
    
    -- Metadata
    ip_address INET,
    user_agent TEXT
);

-- Daily Usage Aggregates (for faster reporting)
CREATE TABLE daily_usage_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    
    -- Relations
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    service VARCHAR(100) NOT NULL,
    
    -- Aggregated metrics
    total_calls INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(12,4) DEFAULT 0,
    avg_response_time INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    -- Unique constraint
    UNIQUE(date, company_id, user_id, service)
);

-- =============================================
-- COMPONENT & VIEW MANAGEMENT
-- =============================================

-- Available Dashboard Components
CREATE TABLE dashboard_components (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Component info
    name VARCHAR(255) NOT NULL,
    component_key VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100),
    
    -- Configuration
    default_config JSONB DEFAULT '{}',
    required_permissions TEXT[],
    required_features TEXT[],
    
    -- Pricing (if premium component)
    is_premium BOOLEAN DEFAULT false,
    monthly_cost DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    version VARCHAR(20) DEFAULT '1.0.0'
);

-- Company Dashboard Layout
CREATE TABLE company_dashboard_layouts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Relations
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Layout configuration
    layout_name VARCHAR(255) DEFAULT 'default',
    components JSONB NOT NULL, -- Array of component configurations
    grid_layout JSONB DEFAULT '{}',
    
    -- Access control
    allowed_roles TEXT[] DEFAULT ARRAY['owner', 'admin', 'manager', 'member'],
    
    -- Status
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
);

-- User Custom Views
CREATE TABLE user_custom_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Relations
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- View info
    view_name VARCHAR(255) NOT NULL,
    view_type VARCHAR(100) NOT NULL, -- 'dashboard', 'leads', 'contacts', etc.
    
    -- Configuration
    config JSONB NOT NULL,
    filters JSONB DEFAULT '{}',
    sorting JSONB DEFAULT '{}',
    
    -- Sharing
    is_shared BOOLEAN DEFAULT false,
    shared_with_roles TEXT[],
    
    UNIQUE(user_id, view_name, view_type)
);

-- =============================================
-- BILLING & COST TRACKING
-- =============================================

-- Company Billing History
CREATE TABLE billing_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Relations
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Billing period
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    
    -- Costs breakdown
    base_cost DECIMAL(10,2) DEFAULT 0,
    api_costs DECIMAL(10,2) DEFAULT 0,
    llm_costs DECIMAL(10,2) DEFAULT 0,
    premium_features_cost DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) NOT NULL,
    
    -- Usage stats
    total_api_calls INTEGER DEFAULT 0,
    total_llm_tokens INTEGER DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    
    -- Payment
    invoice_id VARCHAR(255),
    payment_status VARCHAR(50) DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Details
    cost_breakdown JSONB DEFAULT '{}'
);

-- Cost Alerts
CREATE TABLE cost_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Relations
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Alert configuration
    alert_type VARCHAR(50) NOT NULL, -- 'monthly_limit', 'daily_limit', 'api_cost', 'llm_cost'
    threshold_amount DECIMAL(10,2),
    threshold_percentage INTEGER,
    
    -- Notification settings
    notify_email BOOLEAN DEFAULT true,
    notify_slack BOOLEAN DEFAULT false,
    notify_dashboard BOOLEAN DEFAULT true,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_triggered TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Companies
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_created_by ON companies(created_by);
CREATE INDEX idx_companies_template_id ON companies(template_id);

-- User Profiles
CREATE INDEX idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);

-- API Keys
CREATE INDEX idx_company_api_keys_company_id ON company_api_keys(company_id);
CREATE INDEX idx_company_api_keys_service ON company_api_keys(service);
CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX idx_user_api_keys_company_id ON user_api_keys(company_id);

-- Usage Logs
CREATE INDEX idx_api_usage_logs_company_id ON api_usage_logs(company_id);
CREATE INDEX idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX idx_api_usage_logs_service ON api_usage_logs(service);

-- Daily Stats
CREATE INDEX idx_daily_usage_stats_date ON daily_usage_stats(date);
CREATE INDEX idx_daily_usage_stats_company_id ON daily_usage_stats(company_id);

-- =============================================
-- HELPER FUNCTIONS FOR RLS
-- =============================================

-- Safely get the current user's company_id without causing recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID AS $$
DECLARE
  company_uuid UUID;
BEGIN
  -- This function runs with the privileges of the user who defined it (the owner),
  -- bypassing the RLS policies of the calling user, which prevents recursion.
  SELECT company_id INTO company_uuid FROM public.user_profiles WHERE id = auth.uid();
  RETURN company_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if the current user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_super BOOLEAN;
BEGIN
  -- This function also runs with definer privileges to bypass RLS on super_admins table
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins sa
    WHERE sa.user_id = auth.uid() AND sa.status = 'active'
  ) INTO is_super;
  RETURN is_super;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_alerts ENABLE ROW LEVEL SECURITY;

-- Super Admin Policies
CREATE POLICY "Super admins can manage everything" ON super_admins
    FOR ALL USING (public.is_super_admin());

-- Client Templates Policies
CREATE POLICY "Authenticated users can view client templates" ON client_templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- Company Policies
CREATE POLICY "Super admins can manage all companies" ON companies
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Users can view own company" ON companies
    FOR SELECT USING (
        id = public.get_my_company_id()
    );

-- User Profiles Policies
CREATE POLICY "Users can view company members" ON user_profiles
    FOR SELECT USING (
        (company_id = public.get_my_company_id()) OR
        public.is_super_admin()
    );

-- API Keys Policies
CREATE POLICY "Company admins can manage company API keys" ON company_api_keys
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        ) OR
        public.is_super_admin()
    );

CREATE POLICY "Users can manage own API keys" ON user_api_keys
    FOR ALL USING (
        user_id = auth.uid() OR
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        ) OR
        public.is_super_admin()
    );

-- =============================================
-- FUNCTIONS FOR COST TRACKING
-- =============================================

-- Function to log API usage
CREATE OR REPLACE FUNCTION log_api_usage(
    p_company_id UUID,
    p_user_id UUID,
    p_service VARCHAR,
    p_endpoint VARCHAR,
    p_tokens INTEGER DEFAULT 0,
    p_cost DECIMAL DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    usage_id UUID;
BEGIN
    -- Insert usage log
    INSERT INTO api_usage_logs (
        company_id, user_id, service, endpoint, 
        tokens_used, cost, status
    ) VALUES (
        p_company_id, p_user_id, p_service, p_endpoint,
        p_tokens, p_cost, 'success'
    ) RETURNING id INTO usage_id;
    
    -- Update user API key usage if applicable
    UPDATE user_api_keys 
    SET 
        total_calls = total_calls + 1,
        total_tokens = total_tokens + p_tokens,
        total_cost = total_cost + p_cost,
        current_month_calls = current_month_calls + 1,
        current_month_tokens = current_month_tokens + p_tokens,
        current_month_cost = current_month_cost + p_cost,
        last_used = NOW()
    WHERE user_id = p_user_id AND service = p_service;
    
    -- Update daily stats
    INSERT INTO daily_usage_stats (
        date, company_id, user_id, service,
        total_calls, total_tokens, total_cost
    ) VALUES (
        CURRENT_DATE, p_company_id, p_user_id, p_service,
        1, p_tokens, p_cost
    )
    ON CONFLICT (date, company_id, user_id, service)
    DO UPDATE SET
        total_calls = daily_usage_stats.total_calls + 1,
        total_tokens = daily_usage_stats.total_tokens + p_tokens,
        total_cost = daily_usage_stats.total_cost + p_cost;
    
    RETURN usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user limits
CREATE OR REPLACE FUNCTION check_user_limits(
    p_user_id UUID,
    p_service VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    user_key RECORD;
    is_within_limits BOOLEAN := true;
BEGIN
    SELECT * INTO user_key
    FROM user_api_keys
    WHERE user_id = p_user_id AND service = p_service AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check monthly limits
    IF user_key.current_month_calls >= user_key.monthly_limit_calls OR
       user_key.current_month_cost >= user_key.monthly_limit_cost THEN
        
        -- Update status to over_limit
        UPDATE user_api_keys 
        SET status = 'over_limit' 
        WHERE id = user_key.id;
        
        is_within_limits := false;
    END IF;
    
    RETURN is_within_limits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Reset monthly usage counters
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
    UPDATE user_api_keys 
    SET 
        current_month_calls = 0,
        current_month_tokens = 0,
        current_month_cost = 0,
        current_month_reset = DATE_TRUNC('month', NOW()),
        status = CASE 
            WHEN status = 'over_limit' THEN 'active' 
            ELSE status 
        END
    WHERE current_month_reset < DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;

-- Schedule monthly reset (you'll need to set up a cron job or use pg_cron extension)
-- SELECT cron.schedule('reset-monthly-usage', '0 0 1 * *', 'SELECT reset_monthly_usage();');