-- =============================================
-- MIGRACIÓN: TABLA PARA COMPROBANTES DE PAGOS
-- =============================================

-- Crear tabla para almacenar comprobantes de pagos
CREATE TABLE IF NOT EXISTS payment_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_payment_id UUID REFERENCES tax_payments(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Información del archivo
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT, -- 'pdf', 'jpg', 'png', etc.
    file_size INTEGER, -- en bytes
    
    -- Metadatos del comprobante
    receipt_type TEXT NOT NULL CHECK (receipt_type IN (
        'factura', 'recibo', 'comprobante_pago', 'transferencia', 'cheque', 'otro'
    )),
    receipt_number TEXT,
    receipt_date DATE,
    vendor_name TEXT, -- Nombre del proveedor/entidad
    
    -- Información adicional
    description TEXT,
    notes TEXT,
    
    -- Auditoría
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can view payment receipts"
ON payment_receipts FOR SELECT
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

CREATE POLICY "Authenticated users can manage payment receipts"
ON payment_receipts FOR ALL
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_payment_receipts_tax_payment_id ON payment_receipts(tax_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_project_id ON payment_receipts(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_receipt_date ON payment_receipts(receipt_date);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_receipt_type ON payment_receipts(receipt_type);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_payment_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_payment_receipts_updated_at ON payment_receipts;
CREATE TRIGGER trigger_update_payment_receipts_updated_at
    BEFORE UPDATE ON payment_receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_receipts_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE payment_receipts IS 'Almacena comprobantes y archivos relacionados con pagos de tasas gubernamentales';
COMMENT ON COLUMN payment_receipts.tax_payment_id IS 'Referencia al pago en tax_payments';
COMMENT ON COLUMN payment_receipts.receipt_type IS 'Tipo de comprobante: factura, recibo, comprobante_pago, etc.';
COMMENT ON COLUMN payment_receipts.file_url IS 'URL del archivo en Supabase Storage';