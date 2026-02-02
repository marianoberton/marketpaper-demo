-- =============================================
-- MIGRACIÓN 0040: CORREGIR POLÍTICAS RLS DE FINANZAS
-- =============================================
-- Reemplaza get_my_company_id() por get_user_company_id() en todas las políticas RLS
-- MIGRACIÓN ADITIVA - SEGURA PARA PRODUCCIÓN

-- =============================================
-- TABLA: categories
-- =============================================

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Users can view their company categories" ON categories;
DROP POLICY IF EXISTS "Users can create categories for their company" ON categories;
DROP POLICY IF EXISTS "Users can update their company categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their company categories" ON categories;

-- Crear políticas corregidas
CREATE POLICY "Users can view their company categories"
ON categories FOR SELECT
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_user_company_id())
);

CREATE POLICY "Users can create categories for their company"
ON categories FOR INSERT
WITH CHECK (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_user_company_id())
);

CREATE POLICY "Users can update their company categories"
ON categories FOR UPDATE
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_user_company_id())
);

CREATE POLICY "Users can delete their company categories"
ON categories FOR DELETE
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_user_company_id())
);

-- =============================================
-- TABLA: expenses
-- =============================================

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Users can view their company expenses" ON expenses;
DROP POLICY IF EXISTS "Users can create expenses for their company" ON expenses;
DROP POLICY IF EXISTS "Users can update their company expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete their company expenses" ON expenses;

-- Crear políticas corregidas
CREATE POLICY "Users can view their company expenses"
ON expenses FOR SELECT
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_user_company_id())
);

CREATE POLICY "Users can create expenses for their company"
ON expenses FOR INSERT
WITH CHECK (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_user_company_id())
);

CREATE POLICY "Users can update their company expenses"
ON expenses FOR UPDATE
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_user_company_id())
);

CREATE POLICY "Users can delete their company expenses"
ON expenses FOR DELETE
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_user_company_id())
);

-- =============================================
-- TABLA: imported_files
-- =============================================

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Users can view their company imported files" ON imported_files;
DROP POLICY IF EXISTS "Users can create imported files for their company" ON imported_files;
DROP POLICY IF EXISTS "Users can update their company imported files" ON imported_files;
DROP POLICY IF EXISTS "Users can delete their company imported files" ON imported_files;

-- Crear políticas corregidas
CREATE POLICY "Users can view their company imported files"
ON imported_files FOR SELECT
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_user_company_id())
);

CREATE POLICY "Users can create imported files for their company"
ON imported_files FOR INSERT
WITH CHECK (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_user_company_id())
);

CREATE POLICY "Users can update their company imported files"
ON imported_files FOR UPDATE
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_user_company_id())
);

CREATE POLICY "Users can delete their company imported files"
ON imported_files FOR DELETE
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_user_company_id())
);
