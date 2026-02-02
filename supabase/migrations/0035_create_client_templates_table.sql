-- =============================================
-- MIGRACIÓN 0035: CREAR TABLA client_templates
-- =============================================
-- Esta tabla almacena plantillas de configuración para empresas
-- Cada plantilla define qué módulos están disponibles
-- MIGRACIÓN ADITIVA - SEGURA PARA PRODUCCIÓN

-- Crear tabla client_templates
CREATE TABLE IF NOT EXISTS client_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'standard' CHECK (category IN ('standard', 'premium', 'enterprise', 'custom')),

  -- Legacy fields (mantener por compatibilidad)
  available_features TEXT[] DEFAULT '{}',

  -- Límites
  max_users INTEGER DEFAULT 5,
  max_contacts INTEGER DEFAULT 1000,
  max_api_calls INTEGER DEFAULT 10000,

  -- Precios
  monthly_price DECIMAL(10,2) DEFAULT 0,
  setup_fee DECIMAL(10,2) DEFAULT 0,

  -- Estado
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_templates_active ON client_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_client_templates_category ON client_templates(category);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_client_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_client_templates_updated_at
  BEFORE UPDATE ON client_templates
  FOR EACH ROW EXECUTE FUNCTION update_client_templates_updated_at();

-- RLS
ALTER TABLE client_templates ENABLE ROW LEVEL SECURITY;

-- Solo super admins pueden gestionar plantillas
CREATE POLICY "Super admins manage templates" ON client_templates
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Usuarios autenticados pueden leer plantillas activas
CREATE POLICY "Users read active templates" ON client_templates
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Comentarios
COMMENT ON TABLE client_templates IS 'Plantillas de configuración de empresas con módulos asignados';
COMMENT ON COLUMN client_templates.available_features IS 'LEGACY: Array de features para backward compatibility';
COMMENT ON COLUMN client_templates.max_users IS 'Límite máximo de usuarios para empresas con esta plantilla';
COMMENT ON COLUMN client_templates.max_contacts IS 'Límite máximo de contactos CRM';
COMMENT ON COLUMN client_templates.max_api_calls IS 'Límite máximo de llamadas API por mes';
