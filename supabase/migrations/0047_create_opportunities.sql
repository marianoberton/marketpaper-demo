-- =============================================
-- MIGRACION 0047: Crear tabla opportunities + modulo Oportunidades
-- =============================================
-- MIGRACION ADITIVA - SEGURA PARA PRODUCCION
-- 1. Crea la tabla opportunities para pipeline de oportunidades de negocio
-- 2. Aplica RLS (patron de 3 capas)
-- 3. Registra el modulo Oportunidades en la navegacion

-- ==========================================
-- PARTE A: Crear tabla opportunities
-- ==========================================

CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Core fields
    title TEXT NOT NULL,
    description TEXT,

    -- Relationships
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    quote_id UUID,  -- Sin FK por ahora (cotizador no existe aun)

    -- Pipeline
    stage TEXT NOT NULL DEFAULT 'calificacion'
        CHECK (stage IN ('calificacion', 'propuesta', 'negociacion', 'cierre')),
    outcome TEXT CHECK (outcome IS NULL OR outcome IN ('won', 'lost')),
    probability INTEGER NOT NULL DEFAULT 25
        CHECK (probability >= 0 AND probability <= 100),

    -- Value
    estimated_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    weighted_value DECIMAL(12,2) GENERATED ALWAYS AS (estimated_value * probability / 100) STORED,
    currency TEXT NOT NULL DEFAULT 'USD',

    -- Dates
    expected_close_date DATE,
    closed_at TIMESTAMPTZ,

    -- Nice-to-have fields
    loss_reason TEXT,
    position_order INTEGER NOT NULL DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- PARTE B: Enable RLS + Policies
-- ==========================================

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Layer 1: Super admin full access
CREATE POLICY "Super admins full access on opportunities" ON opportunities
    FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- RLS Layer 2: Company admin manage
CREATE POLICY "Company admins manage opportunities" ON opportunities
    FOR ALL
    USING (company_id = public.get_my_company_id() AND public.is_company_admin())
    WITH CHECK (company_id = public.get_my_company_id() AND public.is_company_admin());

-- RLS Layer 3: Users read own company
CREATE POLICY "Users read own company opportunities" ON opportunities
    FOR SELECT
    USING (public.is_super_admin() OR (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()));

-- Users in company can INSERT
CREATE POLICY "Company users can create opportunities" ON opportunities
    FOR INSERT
    WITH CHECK (public.is_super_admin() OR (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()));

-- Users in company can UPDATE
CREATE POLICY "Company users can update opportunities" ON opportunities
    FOR UPDATE
    USING (public.is_super_admin() OR (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()));

-- Company admins can DELETE
CREATE POLICY "Company admins can delete opportunities" ON opportunities
    FOR DELETE
    USING (public.is_super_admin() OR (company_id = public.get_my_company_id() AND public.is_company_admin()));

-- ==========================================
-- PARTE C: Indexes
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_opportunities_company_id ON opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_client_id ON opportunities(client_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_assigned_to ON opportunities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_company_stage ON opportunities(company_id, stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_expected_close ON opportunities(expected_close_date) WHERE stage != 'cierre';

-- ==========================================
-- PARTE D: Trigger updated_at
-- ==========================================

CREATE TRIGGER trigger_opportunities_updated_at
    BEFORE UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- PARTE E: Registrar modulo Oportunidades
-- ==========================================

INSERT INTO modules (name, route_path, icon, category, display_order, is_core, description) VALUES
  ('Oportunidades', '/workspace/oportunidades', 'Target', 'Workspace', 45, false, 'Pipeline de oportunidades de negocio')
ON CONFLICT (route_path) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  is_core = EXCLUDED.is_core,
  description = EXCLUDED.description;

-- Agregar modulo a templates que ya tengan Ventas
INSERT INTO template_modules (template_id, module_id)
SELECT tm.template_id, m.id
FROM modules m
CROSS JOIN (
  SELECT DISTINCT template_id
  FROM template_modules
  WHERE module_id = (SELECT id FROM modules WHERE route_path = '/workspace/ventas' LIMIT 1)
) tm
WHERE m.route_path = '/workspace/oportunidades'
ON CONFLICT (template_id, module_id) DO NOTHING;

COMMENT ON TABLE opportunities IS 'Pipeline de oportunidades de negocio. Cada oportunidad pertenece a un company_id (tenant) y puede vincularse a un cliente (clients) y un responsable comercial (user_profiles).';
