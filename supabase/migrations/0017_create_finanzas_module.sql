-- Crear tabla de categorías para finanzas
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#64748b',
    icon TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    budget_limit NUMERIC(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Índices y constraints
    CONSTRAINT categories_name_company_unique UNIQUE (company_id, name),
    CONSTRAINT categories_budget_positive CHECK (budget_limit IS NULL OR budget_limit >= 0)
);

-- Habilitamos RLS para categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para categories
CREATE POLICY "Users can view their company categories"
ON categories FOR SELECT
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) 
);

CREATE POLICY "Users can create categories for their company"
ON categories FOR INSERT
WITH CHECK ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) 
);

CREATE POLICY "Users can update their company categories"
ON categories FOR UPDATE
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) 
);

CREATE POLICY "Users can delete their company categories"
ON categories FOR DELETE
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) 
);

-- Crear tabla de gastos
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'other',
    receipt_url TEXT,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT expenses_amount_positive CHECK (amount > 0),
    CONSTRAINT expenses_payment_method_valid CHECK (
        payment_method IN ('credit_card', 'debit_card', 'cash', 'bank_transfer', 'other')
    ),
    CONSTRAINT expenses_recurring_frequency_valid CHECK (
        recurring_frequency IS NULL OR 
        recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')
    )
);

-- Índices para optimizar consultas
CREATE INDEX idx_expenses_company_id ON expenses(company_id);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_payment_method ON expenses(payment_method);
CREATE INDEX idx_expenses_is_recurring ON expenses(is_recurring);

-- Habilitamos RLS para expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para expenses
CREATE POLICY "Users can view their company expenses"
ON expenses FOR SELECT
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) 
);

CREATE POLICY "Users can create expenses for their company"
ON expenses FOR INSERT
WITH CHECK ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) 
);

CREATE POLICY "Users can update their company expenses"
ON expenses FOR UPDATE
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) 
);

CREATE POLICY "Users can delete their company expenses"
ON expenses FOR DELETE
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) 
);

-- Crear tabla para archivos importados
CREATE TABLE imported_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    processing_status TEXT NOT NULL DEFAULT 'pending',
    extracted_expenses INTEGER DEFAULT 0,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT imported_files_file_type_valid CHECK (
        file_type IN ('credit_card', 'bank_statement', 'receipt', 'other')
    ),
    CONSTRAINT imported_files_processing_status_valid CHECK (
        processing_status IN ('pending', 'processing', 'completed', 'failed')
    ),
    CONSTRAINT imported_files_extracted_expenses_positive CHECK (extracted_expenses >= 0)
);

-- Índices para imported_files
CREATE INDEX idx_imported_files_company_id ON imported_files(company_id);
CREATE INDEX idx_imported_files_file_type ON imported_files(file_type);
CREATE INDEX idx_imported_files_processing_status ON imported_files(processing_status);
CREATE INDEX idx_imported_files_uploaded_by ON imported_files(uploaded_by);

-- Habilitamos RLS para imported_files
ALTER TABLE imported_files ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para imported_files
CREATE POLICY "Users can view their company imported files"
ON imported_files FOR SELECT
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) 
);

CREATE POLICY "Users can create imported files for their company"
ON imported_files FOR INSERT
WITH CHECK ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) 
);

CREATE POLICY "Users can update their company imported files"
ON imported_files FOR UPDATE
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) 
);

CREATE POLICY "Users can delete their company imported files"
ON imported_files FOR DELETE
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) 
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at 
    BEFORE UPDATE ON expenses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_imported_files_updated_at 
    BEFORE UPDATE ON imported_files 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar categorías por defecto para empresas existentes
INSERT INTO categories (company_id, name, description, color, icon, is_active, budget_limit)
SELECT 
    c.id as company_id,
    cat.name,
    cat.description,
    cat.color,
    cat.icon,
    true as is_active,
    NULL as budget_limit
FROM companies c
CROSS JOIN (
    VALUES 
    ('Alimentación', 'Comida y bebidas', '#10b981', '🍕'),
    ('Transporte', 'Combustible, transporte público, uber', '#3b82f6', '🚗'),
    ('Entretenimiento', 'Cine, streaming, salidas', '#8b5cf6', '🎬'),
    ('Salud', 'Medicamentos, consultas médicas', '#ef4444', '🏥'),
    ('Educación', 'Cursos, libros, capacitación', '#f59e0b', '📚'),
    ('Compras', 'Ropa, accesorios, productos varios', '#ec4899', '🛍️'),
    ('Servicios', 'Internet, luz, gas, teléfono', '#6b7280', '🔧'),
    ('Vivienda', 'Alquiler, expensas, mantenimiento', '#0891b2', '🏠'),
    ('Ahorro e Inversión', 'Inversiones, ahorros', '#16a34a', '💰'),
    ('Otros', 'Gastos varios no categorizados', '#64748b', '📝')
) AS cat(name, description, color, icon)
ON CONFLICT (company_id, name) DO NOTHING;

-- Crear bucket de storage para archivos de finanzas si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('finance-imports', 'finance-imports', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para el bucket finance-imports
CREATE POLICY "Users can upload finance files to their company folder"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'finance-imports' AND
    (public.is_super_admin() OR auth.uid() IS NOT NULL)
);

CREATE POLICY "Users can view finance files from their company folder"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'finance-imports' AND
    (public.is_super_admin() OR auth.uid() IS NOT NULL)
);

CREATE POLICY "Users can update finance files from their company folder"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'finance-imports' AND
    (public.is_super_admin() OR auth.uid() IS NOT NULL)
);

CREATE POLICY "Users can delete finance files from their company folder"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'finance-imports' AND
    (public.is_super_admin() OR auth.uid() IS NOT NULL)
); 