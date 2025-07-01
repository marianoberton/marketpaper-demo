-- Migración para agregar Informe de Dominio y Tasas Gubernamentales
-- Fecha: 2024-01-XX

-- =============================================
-- INFORME DE DOMINIO
-- =============================================

-- Agregar campos para Informe de Dominio en projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain_report_file_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain_report_upload_date TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain_report_expiry_date TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain_report_is_valid BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain_report_notes TEXT;

-- =============================================
-- TASAS Y GRAVÁMENES GUBERNAMENTALES
-- =============================================

-- Agregar campos para costos proyectados y pagados
ALTER TABLE projects ADD COLUMN IF NOT EXISTS projected_total_cost NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS paid_total_cost NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS paid_cost_rubro_a NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS paid_cost_rubro_b NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS paid_cost_rubro_c NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_cost_update TIMESTAMPTZ DEFAULT NOW();

-- =============================================
-- TABLA PARA ENCOMIENDAS PROFESIONALES
-- =============================================

CREATE TABLE IF NOT EXISTS professional_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    council_type TEXT NOT NULL, -- 'CPAU', 'CPIC', etc.
    surface_m2 NUMERIC NOT NULL,
    procedure_type TEXT NOT NULL,
    calculated_fee NUMERIC DEFAULT 0,
    actual_paid NUMERIC DEFAULT 0,
    payment_date TIMESTAMPTZ,
    receipt_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para professional_commissions
ALTER TABLE professional_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view professional commissions"
ON professional_commissions FOR SELECT
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

CREATE POLICY "Authenticated users can manage professional commissions"
ON professional_commissions FOR ALL
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

-- =============================================
-- TABLA PARA DERECHOS DE CONSTRUCCIÓN
-- =============================================

CREATE TABLE IF NOT EXISTS construction_rights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    surface_m2 NUMERIC NOT NULL,
    stage_name TEXT NOT NULL, -- 'Registro Etapa', 'Permiso Obra'
    calculated_fee NUMERIC DEFAULT 0,
    actual_paid NUMERIC DEFAULT 0,
    payment_date TIMESTAMPTZ,
    receipt_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para construction_rights
ALTER TABLE construction_rights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view construction rights"
ON construction_rights FOR SELECT
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

CREATE POLICY "Authenticated users can manage construction rights"
ON construction_rights FOR ALL
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

-- =============================================
-- TABLA PARA DERECHOS DE PLUSVALÍA
-- =============================================

CREATE TABLE IF NOT EXISTS surplus_value_rights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    surface_m2 NUMERIC NOT NULL,
    zone_classification TEXT, -- 'Palermo', 'Lugano', etc.
    uva_coefficient NUMERIC DEFAULT 1.0,
    uva_value NUMERIC DEFAULT 0,
    base_calculation NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    percentage_20_paid NUMERIC DEFAULT 0, -- 20% con permiso
    percentage_40_avo1_paid NUMERIC DEFAULT 0, -- 40% con AVO I
    percentage_40_avo4_paid NUMERIC DEFAULT 0, -- 40% con AVO IV/MH
    payment_stage TEXT, -- 'Pendiente', 'Permiso', 'AVO I', 'AVO IV', 'Completado'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para surplus_value_rights
ALTER TABLE surplus_value_rights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view surplus value rights"
ON surplus_value_rights FOR SELECT
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

CREATE POLICY "Authenticated users can manage surplus value rights"
ON surplus_value_rights FOR ALL
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

-- =============================================
-- TABLA PARA HISTORIAL DE PAGOS GENERALES
-- =============================================

CREATE TABLE IF NOT EXISTS tax_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    payment_type TEXT NOT NULL, -- 'professional_commission', 'construction_rights', 'surplus_value'
    reference_id UUID, -- ID de la tabla específica
    rubro TEXT NOT NULL, -- 'A', 'B', 'C'
    amount NUMERIC NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL,
    receipt_number TEXT,
    description TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para tax_payments
ALTER TABLE tax_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tax payments"
ON tax_payments FOR SELECT
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

CREATE POLICY "Authenticated users can manage tax payments"
ON tax_payments FOR ALL
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

-- =============================================
-- FUNCIÓN PARA CALCULAR VIGENCIA DEL INFORME DE DOMINIO
-- =============================================

CREATE OR REPLACE FUNCTION update_domain_report_validity()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se actualiza la fecha de subida, calcular nueva fecha de vencimiento
    IF NEW.domain_report_upload_date IS NOT NULL AND 
       (OLD.domain_report_upload_date IS NULL OR 
        NEW.domain_report_upload_date != OLD.domain_report_upload_date) THEN
        
        NEW.domain_report_expiry_date := NEW.domain_report_upload_date + INTERVAL '90 days';
    END IF;
    
    -- Determinar si está vigente
    IF NEW.domain_report_expiry_date IS NOT NULL THEN
        NEW.domain_report_is_valid := (NEW.domain_report_expiry_date > NOW());
    ELSE
        NEW.domain_report_is_valid := false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar vigencia automáticamente
DROP TRIGGER IF EXISTS trigger_update_domain_report_validity ON projects;
CREATE TRIGGER trigger_update_domain_report_validity
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_domain_report_validity();

-- =============================================
-- FUNCIÓN PARA ACTUALIZAR COSTOS TOTALES PAGADOS
-- =============================================

CREATE OR REPLACE FUNCTION update_project_paid_costs()
RETURNS TRIGGER AS $$
DECLARE
    project_row RECORD;
    total_a NUMERIC := 0;
    total_b NUMERIC := 0;
    total_c NUMERIC := 0;
BEGIN
    -- Obtener el project_id según la operación
    IF TG_OP = 'DELETE' THEN
        project_row := OLD;
    ELSE
        project_row := NEW;
    END IF;
    
    -- Calcular totales por rubro
    SELECT 
        COALESCE(SUM(CASE WHEN rubro = 'A' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN rubro = 'B' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN rubro = 'C' THEN amount ELSE 0 END), 0)
    INTO total_a, total_b, total_c
    FROM tax_payments 
    WHERE project_id = project_row.project_id;
    
    -- Actualizar el proyecto
    UPDATE projects 
    SET 
        paid_cost_rubro_a = total_a,
        paid_cost_rubro_b = total_b,
        paid_cost_rubro_c = total_c,
        paid_total_cost = total_a + total_b + total_c,
        last_cost_update = NOW()
    WHERE id = project_row.project_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar costos automáticamente
DROP TRIGGER IF EXISTS trigger_update_paid_costs_insert ON tax_payments;
CREATE TRIGGER trigger_update_paid_costs_insert
    AFTER INSERT ON tax_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_project_paid_costs();

DROP TRIGGER IF EXISTS trigger_update_paid_costs_update ON tax_payments;
CREATE TRIGGER trigger_update_paid_costs_update
    AFTER UPDATE ON tax_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_project_paid_costs();

DROP TRIGGER IF EXISTS trigger_update_paid_costs_delete ON tax_payments;
CREATE TRIGGER trigger_update_paid_costs_delete
    AFTER DELETE ON tax_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_project_paid_costs();

-- =============================================
-- ÍNDICES PARA MEJOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_professional_commissions_project_id ON professional_commissions(project_id);
CREATE INDEX IF NOT EXISTS idx_construction_rights_project_id ON construction_rights(project_id);
CREATE INDEX IF NOT EXISTS idx_surplus_value_rights_project_id ON surplus_value_rights(project_id);
CREATE INDEX IF NOT EXISTS idx_tax_payments_project_id ON tax_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_tax_payments_rubro ON tax_payments(rubro);
CREATE INDEX IF NOT EXISTS idx_tax_payments_payment_date ON tax_payments(payment_date);

-- =============================================
-- DATOS INICIALES - CONSEJOS PROFESIONALES
-- =============================================

CREATE TABLE IF NOT EXISTS professional_councils (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    base_fee_formula TEXT, -- Fórmula para cálculo automático (futuro)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO professional_councils (code, name, description) VALUES
('CPAU', 'Consejo Profesional de Arquitectura y Urbanismo', 'Arquitectos'),
('CPIC', 'Consejo Profesional de Ingeniería Civil', 'Ingenieros'),
('CPI', 'Consejo Profesional de Ingeniería', 'Ingenieros Generales')
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- DATOS INICIALES - ZONAS PARA PLUSVALÍA
-- =============================================

CREATE TABLE IF NOT EXISTS surplus_value_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_name TEXT UNIQUE NOT NULL,
    zone_code TEXT,
    multiplier_factor NUMERIC DEFAULT 1.0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO surplus_value_zones (zone_name, zone_code, multiplier_factor, description) VALUES
('Palermo', 'PAL', 1.5, 'Zona de alto valor - Palermo'),
('Recoleta', 'REC', 1.4, 'Zona de alto valor - Recoleta'),
('Belgrano', 'BEL', 1.3, 'Zona de valor medio-alto - Belgrano'),
('Caballito', 'CAB', 1.2, 'Zona de valor medio - Caballito'),
('Villa Crespo', 'VCR', 1.1, 'Zona de valor medio - Villa Crespo'),
('Lugano', 'LUG', 1.0, 'Zona de valor base - Lugano'),
('Mataderos', 'MAT', 1.0, 'Zona de valor base - Mataderos')
ON CONFLICT (zone_name) DO NOTHING; 