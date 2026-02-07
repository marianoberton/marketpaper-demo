-- =============================================
-- MIGRACION 0050: Visibilidad de modulos por rol y usuario
-- =============================================
-- MIGRACION ADITIVA - SEGURA PARA PRODUCCION
-- Permite a cada empresa configurar que modulos ve cada rol,
-- con posibilidad de overrides por usuario individual.

-- ==========================================
-- TABLA 1: company_role_modules
-- Mapea que modulos puede ver cada rol en cada empresa.
-- Si no hay filas para una empresa, se usa el comportamiento
-- global (allowed_roles del modulo).
-- ==========================================
CREATE TABLE IF NOT EXISTS company_role_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('company_owner', 'company_admin', 'manager', 'employee', 'viewer')),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    CONSTRAINT unique_company_role_module UNIQUE (company_id, role, module_id)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_crm_company_id ON company_role_modules(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_company_role ON company_role_modules(company_id, role);

-- Habilitar RLS
ALTER TABLE company_role_modules ENABLE ROW LEVEL SECURITY;

-- Capa 1: Super admin - acceso total
CREATE POLICY "Super admins full access on company_role_modules"
    ON company_role_modules FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Capa 2: Admin de empresa - gestiona su empresa
CREATE POLICY "Company admins manage company_role_modules"
    ON company_role_modules FOR ALL
    USING (company_id = public.get_user_company_id() AND public.is_company_admin())
    WITH CHECK (company_id = public.get_user_company_id() AND public.is_company_admin());

-- Capa 3: Usuarios - lectura de su empresa
CREATE POLICY "Users read own company_role_modules"
    ON company_role_modules FOR SELECT
    USING (
        public.is_super_admin()
        OR (auth.uid() IS NOT NULL AND company_id = public.get_user_company_id())
    );

COMMENT ON TABLE company_role_modules IS 'Per-company mapping of which modules each role can access. Overrides global allowed_roles when populated.';

-- ==========================================
-- TABLA 2: user_module_overrides
-- Excepciones por usuario: grant o revoke de modulos
-- especificos, independiente del rol.
-- ==========================================
CREATE TABLE IF NOT EXISTS user_module_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    override_type TEXT NOT NULL CHECK (override_type IN ('grant', 'revoke')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    CONSTRAINT unique_user_module_override UNIQUE (user_id, module_id)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_umo_user_id ON user_module_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_umo_company_id ON user_module_overrides(company_id);

-- Habilitar RLS
ALTER TABLE user_module_overrides ENABLE ROW LEVEL SECURITY;

-- Capa 1: Super admin - acceso total
CREATE POLICY "Super admins full access on user_module_overrides"
    ON user_module_overrides FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Capa 2: Admin de empresa - gestiona su empresa
CREATE POLICY "Company admins manage user_module_overrides"
    ON user_module_overrides FOR ALL
    USING (company_id = public.get_user_company_id() AND public.is_company_admin())
    WITH CHECK (company_id = public.get_user_company_id() AND public.is_company_admin());

-- Capa 3: Usuarios - lectura de sus propios overrides y los de su empresa
CREATE POLICY "Users read own user_module_overrides"
    ON user_module_overrides FOR SELECT
    USING (
        public.is_super_admin()
        OR user_id = auth.uid()
        OR (auth.uid() IS NOT NULL AND company_id = public.get_user_company_id())
    );

COMMENT ON TABLE user_module_overrides IS 'Per-user module access overrides. grant adds a module, revoke removes it, overriding the role-level configuration.';
