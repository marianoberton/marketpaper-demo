-- =============================================
-- FOMO CRM - Tabla de Leads para PYMEs
-- Migración: 0021_create_pyme_leads_table.sql
-- =============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsquedas difusas

-- =============================================
-- CREAR TABLA PYME_LEADS
-- =============================================

CREATE TABLE pyme_leads (
  -- 🔑 Campos Principales
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- 👤 Datos del Formulario
  full_name VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  website VARCHAR(255),
  country VARCHAR(100) NOT NULL,
  how_found_us TEXT NOT NULL,
  monthly_revenue VARCHAR(100) NOT NULL,
  additional_info TEXT,
  
  -- 📊 Metadatos de Lead
  source VARCHAR(100) DEFAULT 'pyme_form',
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- 🔍 Información Técnica (Tracking)
  user_agent TEXT,
  referrer TEXT,
  page_url TEXT,
  ip_address INET,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_content VARCHAR(255),
  utm_term VARCHAR(255),
  
  -- 👥 Gestión de Leads
  assigned_to UUID REFERENCES user_profiles(id),
  notes TEXT,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  next_follow_up_at TIMESTAMP WITH TIME ZONE,
  
  -- 📅 Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- FUNCIÓN DE LEAD SCORING AUTOMÁTICO
-- =============================================

CREATE OR REPLACE FUNCTION calculate_pyme_lead_score(
  monthly_revenue_val VARCHAR(100),
  position_val VARCHAR(255),
  how_found_us_val TEXT,
  website_val VARCHAR(255),
  additional_info_val TEXT
) RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  keyword_matches INTEGER := 0;
BEGIN
  -- Puntuación por facturación mensual (0-40 puntos)
  CASE 
    WHEN monthly_revenue_val ILIKE '%más de $10 millones%' OR monthly_revenue_val ILIKE '%+$10%' THEN score := score + 40;
    WHEN monthly_revenue_val ILIKE '%$5 - $10 millones%' OR monthly_revenue_val ILIKE '%5-10%' THEN score := score + 35;
    WHEN monthly_revenue_val ILIKE '%$2 - $5 millones%' OR monthly_revenue_val ILIKE '%2-5%' THEN score := score + 30;
    WHEN monthly_revenue_val ILIKE '%$1 - $2 millones%' OR monthly_revenue_val ILIKE '%1-2%' THEN score := score + 25;
    WHEN monthly_revenue_val ILIKE '%$500k - $1 millón%' OR monthly_revenue_val ILIKE '%500k-1M%' THEN score := score + 20;
    WHEN monthly_revenue_val ILIKE '%$100k - $500k%' OR monthly_revenue_val ILIKE '%100k-500k%' THEN score := score + 15;
    WHEN monthly_revenue_val ILIKE '%menos de $100k%' OR monthly_revenue_val ILIKE '%<100k%' THEN score := score + 10;
    ELSE score := score + 5;
  END CASE;

  -- Puntuación por puesto/cargo (0-25 puntos)
  CASE 
    WHEN position_val ILIKE '%CEO%' OR position_val ILIKE '%Fundador%' OR position_val ILIKE '%Founder%' OR position_val ILIKE '%Director General%' THEN score := score + 25;
    WHEN position_val ILIKE '%Director%' OR position_val ILIKE '%VP%' OR position_val ILIKE '%Vicepresidente%' THEN score := score + 20;
    WHEN position_val ILIKE '%Gerente%' OR position_val ILIKE '%Manager%' OR position_val ILIKE '%Jefe%' THEN score := score + 15;
    WHEN position_val ILIKE '%Coordinador%' OR position_val ILIKE '%Responsable%' OR position_val ILIKE '%Supervisor%' THEN score := score + 10;
    ELSE score := score + 5;
  END CASE;

  -- Puntuación por cómo nos encontró (0-20 puntos)
  CASE 
    WHEN how_found_us_val ILIKE '%referencia%' OR how_found_us_val ILIKE '%recomendación%' THEN score := score + 20;
    WHEN how_found_us_val ILIKE '%linkedin%' THEN score := score + 18;
    WHEN how_found_us_val ILIKE '%google%' OR how_found_us_val ILIKE '%búsqueda%' THEN score := score + 15;
    WHEN how_found_us_val ILIKE '%redes sociales%' OR how_found_us_val ILIKE '%facebook%' OR how_found_us_val ILIKE '%instagram%' THEN score := score + 12;
    WHEN how_found_us_val ILIKE '%evento%' OR how_found_us_val ILIKE '%conferencia%' THEN score := score + 15;
    WHEN how_found_us_val ILIKE '%publicidad%' OR how_found_us_val ILIKE '%anuncio%' THEN score := score + 10;
    ELSE score := score + 5;
  END CASE;

  -- Puntuación por tener website (0-10 puntos)
  IF website_val IS NOT NULL AND LENGTH(website_val) > 5 THEN
    score := score + 10;
  END IF;

  -- Puntuación por información adicional detallada (0-5 puntos)
  IF additional_info_val IS NOT NULL AND LENGTH(additional_info_val) > 50 THEN
    score := score + 5;
    
    -- Palabras clave de alta intención
    SELECT COUNT(*) INTO keyword_matches
    FROM unnest(ARRAY['urgente', 'inmediato', 'proyecto', 'presupuesto', 'cotización', 'contratar', 'necesitamos', 'queremos implementar']) AS keyword
    WHERE additional_info_val ILIKE '%' || keyword || '%';
    
    score := score + LEAST(keyword_matches * 2, 10);
  END IF;

  -- Asegurar que el score esté entre 0 y 100
  RETURN GREATEST(0, LEAST(score, 100));
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN PARA CALCULAR PRIORIDAD AUTOMÁTICA
-- =============================================

CREATE OR REPLACE FUNCTION calculate_pyme_priority(score INTEGER) RETURNS VARCHAR(20) AS $$
BEGIN
  CASE 
    WHEN score >= 90 THEN RETURN 'urgent';
    WHEN score >= 75 THEN RETURN 'high';
    WHEN score >= 60 THEN RETURN 'medium';
    ELSE RETURN 'low';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER PARA SCORING AUTOMÁTICO
-- =============================================

CREATE OR REPLACE FUNCTION trigger_calculate_pyme_lead_score() RETURNS TRIGGER AS $$
BEGIN
  -- Calcular score automáticamente
  NEW.lead_score := calculate_pyme_lead_score(
    NEW.monthly_revenue,
    NEW.position,
    NEW.how_found_us,
    NEW.website,
    NEW.additional_info
  );
  
  -- Calcular prioridad automáticamente
  NEW.priority := calculate_pyme_priority(NEW.lead_score);
  
  -- Actualizar timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para INSERT y UPDATE
CREATE TRIGGER trigger_pyme_lead_scoring
  BEFORE INSERT OR UPDATE ON pyme_leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_pyme_lead_score();

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices básicos
CREATE INDEX idx_pyme_leads_company_id ON pyme_leads(company_id);
CREATE INDEX idx_pyme_leads_email ON pyme_leads(email);
CREATE INDEX idx_pyme_leads_status ON pyme_leads(status);
CREATE INDEX idx_pyme_leads_priority ON pyme_leads(priority);
CREATE INDEX idx_pyme_leads_submitted_at ON pyme_leads(submitted_at DESC);

-- Índices compuestos para filtros comunes
CREATE INDEX idx_pyme_leads_company_status ON pyme_leads(company_id, status);
CREATE INDEX idx_pyme_leads_company_priority ON pyme_leads(company_id, priority);
CREATE INDEX idx_pyme_leads_assigned_to ON pyme_leads(assigned_to) WHERE assigned_to IS NOT NULL;

-- Índice para búsquedas de texto
CREATE INDEX idx_pyme_leads_search ON pyme_leads USING gin(
  (full_name || ' ' || email || ' ' || company || ' ' || COALESCE(additional_info, ''))
);

-- =============================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =============================================

-- Habilitar RLS en la tabla
ALTER TABLE pyme_leads ENABLE ROW LEVEL SECURITY;

-- Política para inserción pública (formularios web)
CREATE POLICY "Allow public insert for pyme leads" ON pyme_leads
  FOR INSERT 
  WITH CHECK (true);

-- Política para que los usuarios solo vean leads de su empresa
CREATE POLICY "Users can view leads from their company" ON pyme_leads
  FOR SELECT 
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Política para que los usuarios solo actualicen leads de su empresa
CREATE POLICY "Users can update leads from their company" ON pyme_leads
  FOR UPDATE 
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Política para que los usuarios solo eliminen leads de su empresa
CREATE POLICY "Users can delete leads from their company" ON pyme_leads
  FOR DELETE 
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Política especial para super_admins
CREATE POLICY "Super admins can access all pyme leads" ON pyme_leads
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- =============================================
-- FUNCIÓN DE ACTUALIZACIÓN DE TIMESTAMP
-- =============================================

CREATE OR REPLACE FUNCTION update_pyme_leads_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pyme_leads_timestamp
  BEFORE UPDATE ON pyme_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_pyme_leads_updated_at();

-- =============================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =============================================

COMMENT ON TABLE pyme_leads IS 'Tabla para capturar y gestionar leads específicos de PYMEs con scoring automático';
COMMENT ON COLUMN pyme_leads.lead_score IS 'Puntuación automática de 0-100 basada en facturación, puesto, fuente y engagement';
COMMENT ON COLUMN pyme_leads.priority IS 'Prioridad calculada automáticamente: urgent (90+), high (75+), medium (60+), low (<60)';
COMMENT ON COLUMN pyme_leads.monthly_revenue IS 'Rango de facturación mensual de la empresa del lead';
COMMENT ON COLUMN pyme_leads.how_found_us IS 'Canal o método por el cual el lead nos conoció';

-- =============================================
-- GRANTS PARA ACCESO ANÓNIMO (FORMULARIOS WEB)
-- =============================================

-- Permitir inserción anónima para captura de leads desde formularios web
GRANT INSERT ON pyme_leads TO anon;
GRANT INSERT ON pyme_leads TO authenticated;
GRANT USAGE ON SEQUENCE pyme_leads_id_seq TO anon;
GRANT USAGE ON SEQUENCE pyme_leads_id_seq TO authenticated; 