-- Create contact_leads table with multi-tenant support
CREATE TABLE contact_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenant support (CRITICAL)
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Datos del formulario (pasos 1-4)
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  website VARCHAR(255),
  pain_point TEXT NOT NULL,
  phone VARCHAR(50),
  
  -- Metadatos de lead
  source VARCHAR(100) DEFAULT 'website_form',
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  lead_score INTEGER DEFAULT 0,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Info técnica para analytics
  user_agent TEXT,
  referrer TEXT,
  page_url TEXT,
  ip_address INET,
  
  -- Datos de campaña para tracking
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  utm_term VARCHAR(100),
  
  -- Campos adicionales para CRM
  assigned_to UUID REFERENCES user_profiles(id),
  notes TEXT,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  next_follow_up_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_contact_leads_company_id ON contact_leads(company_id);
CREATE INDEX idx_contact_leads_email ON contact_leads(email);
CREATE INDEX idx_contact_leads_status ON contact_leads(status);
CREATE INDEX idx_contact_leads_submitted_at ON contact_leads(submitted_at);
CREATE INDEX idx_contact_leads_company_name ON contact_leads(company);
CREATE INDEX idx_contact_leads_source ON contact_leads(source);
CREATE INDEX idx_contact_leads_assigned_to ON contact_leads(assigned_to);
CREATE INDEX idx_contact_leads_lead_score ON contact_leads(lead_score);

-- Habilitar Row Level Security
ALTER TABLE contact_leads ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserción pública (formularios web)
-- Esta política es CRÍTICA para que funcionen los formularios de captura
CREATE POLICY "Allow public insert for contact forms" 
ON contact_leads FOR INSERT 
WITH CHECK (true);

-- Política para usuarios autenticados - solo pueden ver leads de su empresa
CREATE POLICY "Users can view contact_leads from their company" 
ON contact_leads FOR SELECT 
USING (
  company_id IN (
    SELECT company_id 
    FROM user_profiles 
    WHERE id = auth.uid()
  ) 
  OR 
  EXISTS (
    SELECT 1 
    FROM super_admins 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Política para actualizar - solo usuarios de la misma empresa
CREATE POLICY "Users can update contact_leads from their company" 
ON contact_leads FOR UPDATE 
USING (
  company_id IN (
    SELECT company_id 
    FROM user_profiles 
    WHERE id = auth.uid()
  ) 
  OR 
  EXISTS (
    SELECT 1 
    FROM super_admins 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Política para eliminar - solo usuarios de la misma empresa
CREATE POLICY "Users can delete contact_leads from their company" 
ON contact_leads FOR DELETE 
USING (
  company_id IN (
    SELECT company_id 
    FROM user_profiles 
    WHERE id = auth.uid()
  ) 
  OR 
  EXISTS (
    SELECT 1 
    FROM super_admins 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Función para calcular lead score automáticamente
CREATE OR REPLACE FUNCTION calculate_lead_score(
  has_website BOOLEAN,
  pain_point_length INTEGER,
  company_size_indicator TEXT,
  source_quality VARCHAR
) RETURNS INTEGER AS $$
DECLARE
  base_score INTEGER := 0;
BEGIN
  -- Score base por tener website
  IF has_website THEN
    base_score := base_score + 20;
  END IF;
  
  -- Score por calidad del pain point
  IF pain_point_length > 100 THEN
    base_score := base_score + 30;
  ELSIF pain_point_length > 50 THEN
    base_score := base_score + 20;
  ELSIF pain_point_length > 20 THEN
    base_score := base_score + 10;
  END IF;
  
  -- Score por fuente
  CASE source_quality
    WHEN 'website_form' THEN base_score := base_score + 25;
    WHEN 'linkedin_ad' THEN base_score := base_score + 30;
    WHEN 'google_ad' THEN base_score := base_score + 20;
    WHEN 'instagram_ad' THEN base_score := base_score + 15;
    WHEN 'facebook_ad' THEN base_score := base_score + 15;
    WHEN 'organic_social' THEN base_score := base_score + 35;
    WHEN 'referral' THEN base_score := base_score + 40;
    ELSE base_score := base_score + 10;
  END CASE;
  
  -- Asegurar que esté en rango 0-100
  RETURN LEAST(100, GREATEST(0, base_score));
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar lead_score automáticamente al insertar
CREATE OR REPLACE FUNCTION update_contact_lead_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.lead_score := calculate_lead_score(
    NEW.website IS NOT NULL AND NEW.website != '',
    LENGTH(NEW.pain_point),
    NEW.company,
    NEW.source
  );
  
  -- Actualizar priority basado en score
  IF NEW.lead_score >= 80 THEN
    NEW.priority := 'urgent';
  ELSIF NEW.lead_score >= 60 THEN
    NEW.priority := 'high';
  ELSIF NEW.lead_score >= 40 THEN
    NEW.priority := 'medium';
  ELSE
    NEW.priority := 'low';
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_lead_score
  BEFORE INSERT OR UPDATE ON contact_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_lead_score();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contact_leads_updated_at
  BEFORE UPDATE ON contact_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE contact_leads IS 'Tabla para almacenar leads capturados desde formularios web y otros canales';
COMMENT ON COLUMN contact_leads.company_id IS 'ID de la empresa - CRÍTICO para multi-tenant';
COMMENT ON COLUMN contact_leads.lead_score IS 'Puntuación automática del lead (0-100)';
COMMENT ON COLUMN contact_leads.status IS 'Estado del lead en el pipeline';
COMMENT ON COLUMN contact_leads.source IS 'Canal de origen del lead para analytics';
COMMENT ON COLUMN contact_leads.pain_point IS 'Problema o necesidad expresada por el lead'; 