-- =============================================
-- FOMO CRM - Sistema Multi-Canal Unificado
-- Migración: 20250717150526_create_unified_crm_system.sql
-- =============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsquedas difusas en deduplicación

-- =============================================
-- TIPOS ENUM PARA EL SISTEMA
-- =============================================

-- Canales de leads
CREATE TYPE lead_channel AS ENUM (
  'web_form', 'facebook_ads', 'instagram_ads', 'linkedin_ads', 'linkedin_organic',
  'google_ads', 'google_organic', 'whatsapp', 'email_marketing', 'cold_call', 
  'referral', 'chatbot', 'event', 'direct', 'other'
);

-- Calidad de leads
CREATE TYPE lead_quality AS ENUM ('hot', 'warm', 'cold', 'unknown');

-- Prioridad de leads
CREATE TYPE lead_priority AS ENUM ('urgent', 'high', 'medium', 'low');

-- Estado de leads
CREATE TYPE lead_status AS ENUM (
  'new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 
  'closed_won', 'closed_lost', 'unqualified'
);

-- Etapas del pipeline
CREATE TYPE pipeline_stage AS ENUM (
  'unqualified', 'lead', 'opportunity', 'proposal', 'negotiation', 'closed'
);

-- Tipos de actividad
CREATE TYPE activity_type AS ENUM (
  'email_sent', 'email_received', 'call_made', 'call_received', 
  'meeting_scheduled', 'meeting_held', 'proposal_sent', 'contract_sent',
  'demo_completed', 'note_added', 'status_changed', 'assignment_changed',
  'social_interaction', 'website_visit', 'content_download', 'whatsapp_message',
  'form_submission', 'ad_click', 'page_view'
);

-- Dirección de actividad
CREATE TYPE activity_direction AS ENUM ('inbound', 'outbound');

-- =============================================
-- TABLA PRINCIPAL: UNIFIED_LEADS
-- =============================================

CREATE TABLE unified_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Información básica (normalizada)
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  position VARCHAR(100),
  
  -- Canal y fuente
  channel_type lead_channel NOT NULL,
  source_id VARCHAR(255), -- ID específico del canal
  source_name VARCHAR(255), -- Nombre descriptivo de la fuente
  
  -- Datos específicos del canal (JSON flexible)
  channel_data JSONB DEFAULT '{}',
  
  -- Información contextual
  utm_data JSONB DEFAULT '{}', -- Todos los parámetros UTM
  technical_data JSONB DEFAULT '{}', -- IP, user_agent, device_info, etc.
  custom_fields JSONB DEFAULT '{}', -- Campos adicionales según necesidades
  
  -- Scoring y clasificación
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  quality_grade lead_quality DEFAULT 'unknown',
  priority lead_priority DEFAULT 'medium',
  
  -- Estado y gestión
  status lead_status DEFAULT 'new',
  stage pipeline_stage DEFAULT 'unqualified',
  assigned_to UUID REFERENCES user_profiles(id),
  
  -- Contexto de negocio
  estimated_value DECIMAL(10,2),
  close_probability INTEGER DEFAULT 0 CHECK (close_probability >= 0 AND close_probability <= 100),
  expected_close_date DATE,
  
  -- Actividad y seguimiento
  first_contact_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  next_action_date TIMESTAMP WITH TIME ZONE,
  
  -- Duplicación y deduplicación
  is_duplicate BOOLEAN DEFAULT false,
  master_lead_id UUID REFERENCES unified_leads(id),
  confidence_score DECIMAL(3,2), -- Para algoritmos de deduplicación
  
  -- Metadatos
  raw_payload JSONB, -- Datos originales sin procesar (para debugging)
  processing_status VARCHAR(50) DEFAULT 'processed', -- 'processing', 'processed', 'failed'
  processing_errors TEXT[],
  
  -- Timestamps
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para unified_leads
CREATE INDEX idx_unified_leads_company_id ON unified_leads(company_id);
CREATE INDEX idx_unified_leads_email ON unified_leads USING gin (email gin_trgm_ops);
CREATE INDEX idx_unified_leads_phone ON unified_leads USING gin (phone gin_trgm_ops);
CREATE INDEX idx_unified_leads_channel_type ON unified_leads(channel_type);
CREATE INDEX idx_unified_leads_status ON unified_leads(status);
CREATE INDEX idx_unified_leads_stage ON unified_leads(stage);
CREATE INDEX idx_unified_leads_quality_grade ON unified_leads(quality_grade);
CREATE INDEX idx_unified_leads_priority ON unified_leads(priority);
CREATE INDEX idx_unified_leads_lead_score ON unified_leads(lead_score);
CREATE INDEX idx_unified_leads_assigned_to ON unified_leads(assigned_to);
CREATE INDEX idx_unified_leads_captured_at ON unified_leads(captured_at);
CREATE INDEX idx_unified_leads_last_activity_at ON unified_leads(last_activity_at);
CREATE INDEX idx_unified_leads_source_id ON unified_leads(source_id);
CREATE INDEX idx_unified_leads_master_lead_id ON unified_leads(master_lead_id);
CREATE INDEX idx_unified_leads_is_duplicate ON unified_leads(is_duplicate);
CREATE INDEX idx_unified_leads_processing_status ON unified_leads(processing_status);

-- Índices para búsquedas en JSONB
CREATE INDEX idx_unified_leads_utm_source ON unified_leads USING gin ((utm_data->>'utm_source'));
CREATE INDEX idx_unified_leads_utm_campaign ON unified_leads USING gin ((utm_data->>'utm_campaign'));
CREATE INDEX idx_unified_leads_channel_data ON unified_leads USING gin (channel_data);

-- =============================================
-- TABLA: CHANNEL_PROCESSORS
-- =============================================

CREATE TABLE channel_processors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  channel_type lead_channel NOT NULL,
  processor_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- Configuración del procesador
  config JSONB NOT NULL DEFAULT '{}', -- Configuración específica del canal
  field_mapping JSONB NOT NULL DEFAULT '{}', -- Mapeo de campos de entrada a campos estándar
  scoring_rules JSONB DEFAULT '{}', -- Reglas de scoring específicas del canal
  validation_rules JSONB DEFAULT '{}', -- Reglas de validación
  
  -- Estadísticas
  total_processed INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  last_processed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para evitar procesadores duplicados por empresa
  UNIQUE(company_id, channel_type)
);

-- Índices para channel_processors
CREATE INDEX idx_channel_processors_company_id ON channel_processors(company_id);
CREATE INDEX idx_channel_processors_channel_type ON channel_processors(channel_type);
CREATE INDEX idx_channel_processors_is_active ON channel_processors(is_active);

-- =============================================
-- TABLA: LEAD_ACTIVITIES
-- =============================================

CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES unified_leads(id) ON DELETE CASCADE,
  
  activity_type activity_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Contexto de la actividad
  channel VARCHAR(100), -- Canal donde ocurrió la actividad
  direction activity_direction, -- 'inbound', 'outbound'
  outcome VARCHAR(100), -- 'successful', 'no_response', 'interested', 'not_interested'
  
  -- Datos específicos según tipo
  activity_data JSONB DEFAULT '{}', -- Email content, call duration, meeting notes, etc.
  
  -- Participantes
  performed_by UUID REFERENCES user_profiles(id),
  participants JSONB DEFAULT '[]', -- Otros participantes en la actividad
  
  -- Programación
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Follow-up
  requires_followup BOOLEAN DEFAULT false,
  followup_date TIMESTAMP WITH TIME ZONE,
  followup_assigned_to UUID REFERENCES user_profiles(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para lead_activities
CREATE INDEX idx_lead_activities_company_id ON lead_activities(company_id);
CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_activity_type ON lead_activities(activity_type);
CREATE INDEX idx_lead_activities_performed_by ON lead_activities(performed_by);
CREATE INDEX idx_lead_activities_completed_at ON lead_activities(completed_at);
CREATE INDEX idx_lead_activities_scheduled_at ON lead_activities(scheduled_at);
CREATE INDEX idx_lead_activities_followup_date ON lead_activities(followup_date);

-- =============================================
-- TABLA: LEAD_SCORING_RULES
-- =============================================

CREATE TABLE lead_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  rule_name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- 'base', 'channel', 'timing', 'context'
  channel_type lead_channel, -- NULL para reglas globales
  
  -- Configuración de la regla
  conditions JSONB NOT NULL, -- Condiciones para aplicar la regla
  score_impact INTEGER NOT NULL, -- Puntos a sumar/restar
  weight DECIMAL(3,2) DEFAULT 1.0, -- Peso de la regla (0.0 - 1.0)
  
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Para ordenar aplicación de reglas
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para lead_scoring_rules
CREATE INDEX idx_lead_scoring_rules_company_id ON lead_scoring_rules(company_id);
CREATE INDEX idx_lead_scoring_rules_channel_type ON lead_scoring_rules(channel_type);
CREATE INDEX idx_lead_scoring_rules_is_active ON lead_scoring_rules(is_active);
CREATE INDEX idx_lead_scoring_rules_priority ON lead_scoring_rules(priority);

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trigger_unified_leads_updated_at
    BEFORE UPDATE ON unified_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_channel_processors_updated_at
    BEFORE UPDATE ON channel_processors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_lead_activities_updated_at
    BEFORE UPDATE ON lead_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_lead_scoring_rules_updated_at
    BEFORE UPDATE ON lead_scoring_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCIÓN DE SCORING AUTOMÁTICO
-- =============================================

CREATE OR REPLACE FUNCTION calculate_unified_lead_score(
    lead_id_param UUID
) RETURNS INTEGER AS $$
DECLARE
    lead_record unified_leads%ROWTYPE;
    base_score INTEGER := 0;
    channel_score INTEGER := 0;
    timing_score INTEGER := 0;
    context_score INTEGER := 0;
    final_score INTEGER := 0;
BEGIN
    -- Obtener el lead
    SELECT * INTO lead_record FROM unified_leads WHERE id = lead_id_param;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Score base (10 puntos)
    base_score := 10;
    
    -- Email válido (+15 puntos)
    IF lead_record.email IS NOT NULL AND lead_record.email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        base_score := base_score + 15;
    END IF;
    
    -- Teléfono (+10 puntos)
    IF lead_record.phone IS NOT NULL AND length(trim(lead_record.phone)) > 8 THEN
        base_score := base_score + 10;
    END IF;
    
    -- Empresa (+10 puntos)
    IF lead_record.company IS NOT NULL AND length(trim(lead_record.company)) > 2 THEN
        base_score := base_score + 10;
    END IF;
    
    -- Posición/cargo (+5 puntos)
    IF lead_record.position IS NOT NULL AND length(trim(lead_record.position)) > 2 THEN
        base_score := base_score + 5;
    END IF;
    
    -- Scoring por canal
    CASE lead_record.channel_type
        WHEN 'linkedin_ads', 'linkedin_organic' THEN channel_score := 20;
        WHEN 'google_ads' THEN channel_score := 15;
        WHEN 'web_form' THEN channel_score := 15;
        WHEN 'referral' THEN channel_score := 25;
        WHEN 'facebook_ads', 'instagram_ads' THEN channel_score := 12;
        WHEN 'email_marketing' THEN channel_score := 8;
        WHEN 'cold_call' THEN channel_score := 5;
        WHEN 'whatsapp' THEN channel_score := 10;
        ELSE channel_score := 5;
    END CASE;
    
    -- Scoring temporal (recency)
    IF lead_record.captured_at >= NOW() - INTERVAL '1 hour' THEN
        timing_score := 15; -- Muy reciente
    ELSIF lead_record.captured_at >= NOW() - INTERVAL '24 hours' THEN
        timing_score := 10; -- Reciente
    ELSIF lead_record.captured_at >= NOW() - INTERVAL '7 days' THEN
        timing_score := 5; -- Esta semana
    ELSE
        timing_score := 0; -- Antiguo
    END IF;
    
    -- Scoring contextual basado en datos del canal
    context_score := 0;
    
    -- UTM campaigns con palabras clave de alta intención
    IF lead_record.utm_data->>'utm_campaign' ~* '(demo|trial|pricing|buy|purchase|enterprise)' THEN
        context_score := context_score + 10;
    END IF;
    
    -- Datos específicos del canal
    IF lead_record.channel_data ? 'high_intent_signals' THEN
        context_score := context_score + 5;
    END IF;
    
    -- Calcular score final
    final_score := base_score + channel_score + timing_score + context_score;
    
    -- Limitar a 100
    final_score := LEAST(final_score, 100);
    
    RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER PARA ACTUALIZAR SCORE AUTOMÁTICAMENTE
-- =============================================

CREATE OR REPLACE FUNCTION trigger_update_lead_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular y actualizar score automáticamente
    NEW.lead_score := calculate_unified_lead_score(NEW.id);
    
    -- Determinar quality_grade basado en score
    IF NEW.lead_score >= 70 THEN
        NEW.quality_grade := 'hot';
    ELSIF NEW.lead_score >= 40 THEN
        NEW.quality_grade := 'warm';
    ELSIF NEW.lead_score >= 20 THEN
        NEW.quality_grade := 'cold';
    ELSE
        NEW.quality_grade := 'unknown';
    END IF;
    
    -- Determinar priority basado en score y canal
    IF NEW.lead_score >= 80 OR NEW.channel_type IN ('referral', 'linkedin_ads') THEN
        NEW.priority := 'high';
    ELSIF NEW.lead_score >= 60 THEN
        NEW.priority := 'medium';
    ELSE
        NEW.priority := 'low';
    END IF;
    
    -- Actualizar last_activity_at si es una actualización
    IF TG_OP = 'UPDATE' THEN
        NEW.last_activity_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_unified_leads_score_update
    BEFORE INSERT OR UPDATE ON unified_leads
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_lead_score();

-- =============================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =============================================

-- Habilitar RLS
ALTER TABLE unified_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_processors ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scoring_rules ENABLE ROW LEVEL SECURITY;

-- Políticas para unified_leads
CREATE POLICY "Companies can view own unified leads" ON unified_leads
    FOR SELECT USING (company_id::text = auth.jwt() ->> 'company_id');

CREATE POLICY "Companies can manage own unified leads" ON unified_leads
    FOR ALL USING (company_id::text = auth.jwt() ->> 'company_id');

-- Política especial para inserts públicos (webhooks)
CREATE POLICY "Allow public insert for unified leads" ON unified_leads
    FOR INSERT WITH CHECK (true);

-- Políticas para channel_processors
CREATE POLICY "Companies can view own channel processors" ON channel_processors
    FOR SELECT USING (company_id::text = auth.jwt() ->> 'company_id');

CREATE POLICY "Companies can manage own channel processors" ON channel_processors
    FOR ALL USING (company_id::text = auth.jwt() ->> 'company_id');

-- Políticas para lead_activities
CREATE POLICY "Companies can view own lead activities" ON lead_activities
    FOR SELECT USING (company_id::text = auth.jwt() ->> 'company_id');

CREATE POLICY "Companies can manage own lead activities" ON lead_activities
    FOR ALL USING (company_id::text = auth.jwt() ->> 'company_id');

-- Políticas para lead_scoring_rules
CREATE POLICY "Companies can view own scoring rules" ON lead_scoring_rules
    FOR SELECT USING (company_id::text = auth.jwt() ->> 'company_id');

CREATE POLICY "Companies can manage own scoring rules" ON lead_scoring_rules
    FOR ALL USING (company_id::text = auth.jwt() ->> 'company_id');

-- =============================================
-- FUNCIÓN DE MIGRACIÓN DE CONTACT_LEADS
-- =============================================

CREATE OR REPLACE FUNCTION migrate_contact_leads_to_unified()
RETURNS TABLE (migrated_count INTEGER, error_count INTEGER) AS $$
DECLARE
    migrated INTEGER := 0;
    errors INTEGER := 0;
    lead_record RECORD;
BEGIN
    -- Migrar todos los contact_leads existentes
    FOR lead_record IN 
        SELECT * FROM contact_leads 
        WHERE NOT EXISTS (
            SELECT 1 FROM unified_leads 
            WHERE unified_leads.email = contact_leads.email 
            AND unified_leads.company_id = contact_leads.company_id
        )
    LOOP
        BEGIN
            INSERT INTO unified_leads (
                company_id, name, email, phone, company, channel_type,
                source_id, source_name, channel_data, utm_data, technical_data,
                status, captured_at, created_at, updated_at
            ) VALUES (
                lead_record.company_id,
                lead_record.name,
                lead_record.email,
                lead_record.phone,
                lead_record.company,
                'web_form',
                'contact_lead_' || lead_record.id::text,
                'Contact Lead Form',
                jsonb_build_object(
                    'pain_point', lead_record.pain_point,
                    'website', lead_record.website,
                    'notes', lead_record.notes,
                    'legacy_contact_lead_id', lead_record.id
                ),
                jsonb_build_object(
                    'utm_source', lead_record.utm_source,
                    'utm_medium', lead_record.utm_medium,
                    'utm_campaign', lead_record.utm_campaign,
                    'utm_content', lead_record.utm_content,
                    'utm_term', lead_record.utm_term
                ),
                jsonb_build_object(
                    'user_agent', lead_record.user_agent,
                    'referrer', lead_record.referrer,
                    'page_url', lead_record.page_url,
                    'ip_address', lead_record.ip_address
                ),
                lead_record.status::lead_status,
                lead_record.submitted_at,
                lead_record.created_at,
                lead_record.updated_at
            );
            
            migrated := migrated + 1;
            
        EXCEPTION WHEN OTHERS THEN
            errors := errors + 1;
            RAISE NOTICE 'Error migrating contact_lead %: %', lead_record.id, SQLERRM;
        END;
    END LOOP;
    
    RETURN QUERY SELECT migrated, errors;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =============================================

COMMENT ON TABLE unified_leads IS 'Tabla central del sistema CRM multi-canal que unifica leads de todas las fuentes';
COMMENT ON COLUMN unified_leads.channel_type IS 'Tipo de canal de origen del lead';
COMMENT ON COLUMN unified_leads.channel_data IS 'Datos específicos del canal en formato JSON';
COMMENT ON COLUMN unified_leads.utm_data IS 'Parámetros UTM para tracking de campañas';
COMMENT ON COLUMN unified_leads.technical_data IS 'Metadatos técnicos (IP, user agent, etc.)';
COMMENT ON COLUMN unified_leads.lead_score IS 'Puntuación automática del lead (0-100)';
COMMENT ON COLUMN unified_leads.quality_grade IS 'Clasificación de calidad basada en scoring';
COMMENT ON COLUMN unified_leads.confidence_score IS 'Confianza en la deduplicación (0.00-1.00)';
COMMENT ON COLUMN unified_leads.raw_payload IS 'Datos originales sin procesar para debugging';

COMMENT ON TABLE channel_processors IS 'Configuración de procesadores para cada canal de leads';
COMMENT ON COLUMN channel_processors.field_mapping IS 'Mapeo de campos específicos del canal a campos estándar';
COMMENT ON COLUMN channel_processors.scoring_rules IS 'Reglas de scoring específicas del canal';

COMMENT ON TABLE lead_activities IS 'Registro de todas las actividades relacionadas con leads';
COMMENT ON COLUMN lead_activities.activity_data IS 'Datos específicos de la actividad en formato JSON';

COMMENT ON TABLE lead_scoring_rules IS 'Reglas configurables para el cálculo de scoring de leads';
COMMENT ON COLUMN lead_scoring_rules.conditions IS 'Condiciones en formato JSON para aplicar la regla';

-- Mensaje de finalización
DO $$
BEGIN
    RAISE NOTICE 'Migración 20250717150526_create_unified_crm_system.sql completada exitosamente';
    RAISE NOTICE 'Sistema CRM multi-canal creado';
    RAISE NOTICE 'Para migrar contact_leads existentes, ejecutar: SELECT * FROM migrate_contact_leads_to_unified();';
END $$;




