-- =============================================
-- SCRIPT PARA CREAR TABLA TAX_PAYMENTS Y FUNCIONES
-- =============================================

-- Crear tabla tax_payments
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

-- Políticas RLS
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

-- Función para actualizar costos totales pagados
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

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_tax_payments_project_id ON tax_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_tax_payments_rubro ON tax_payments(rubro);
CREATE INDEX IF NOT EXISTS idx_tax_payments_payment_date ON tax_payments(payment_date);

-- Verificar que los campos necesarios existan en la tabla projects
-- Agregar campos si no existen (esto es seguro con IF NOT EXISTS)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS paid_cost_rubro_a NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS paid_cost_rubro_b NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS paid_cost_rubro_c NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS paid_total_cost NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_cost_update TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS projected_total_cost NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS enable_tax_management BOOLEAN DEFAULT false;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Tabla tax_payments y funciones creadas exitosamente. Ya puedes registrar pagos de tasas gubernamentales.';
END
$$; 