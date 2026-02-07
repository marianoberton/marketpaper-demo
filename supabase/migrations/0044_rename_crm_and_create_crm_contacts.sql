-- =============================================
-- MIGRACIÓN 0044: RENOMBRAR CRM A CRM-FOMO + CREAR TABLA crm_contacts + NUEVO MÓDULO CRM
-- =============================================
-- MIGRACIÓN ADITIVA - SEGURA PARA PRODUCCIÓN
-- 1. Renombra el módulo CRM existente a CRM-FOMO
-- 2. Crea la tabla crm_contacts para personas de contacto en empresas clientes
-- 3. Inserta el nuevo módulo CRM para gestión de empresas clientes

-- ==========================================
-- PARTE A: Renombrar módulo CRM → CRM-FOMO
-- ==========================================

UPDATE modules SET
  name = 'CRM-FOMO',
  route_path = '/workspace/crm-fomo',
  icon = 'Users',
  description = 'Gestión interna de leads y pipeline (Contact Leads, Pyme Leads, scoring)'
WHERE route_path = '/workspace/crm';

-- ==========================================
-- PARTE B: Crear tabla crm_contacts
-- ==========================================

CREATE TABLE IF NOT EXISTS crm_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    position TEXT,
    is_primary BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Layer 1: Super admin full access
CREATE POLICY "Super admins full access on crm_contacts" ON crm_contacts
    FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- RLS Layer 2: Company admin manage
CREATE POLICY "Company admins manage crm_contacts" ON crm_contacts
    FOR ALL
    USING (company_id = public.get_my_company_id() AND public.is_company_admin())
    WITH CHECK (company_id = public.get_my_company_id() AND public.is_company_admin());

-- RLS Layer 3: Users read own company
CREATE POLICY "Users read own company crm_contacts" ON crm_contacts
    FOR SELECT
    USING (public.is_super_admin() OR (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()));

-- Users in company can INSERT
CREATE POLICY "Company users can create crm_contacts" ON crm_contacts
    FOR INSERT
    WITH CHECK (public.is_super_admin() OR (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()));

-- Users in company can UPDATE
CREATE POLICY "Company users can update crm_contacts" ON crm_contacts
    FOR UPDATE
    USING (public.is_super_admin() OR (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()));

-- Company admins can DELETE
CREATE POLICY "Company admins can delete crm_contacts" ON crm_contacts
    FOR DELETE
    USING (public.is_super_admin() OR (company_id = public.get_my_company_id() AND public.is_company_admin()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_contacts_company_id ON crm_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_client_id ON crm_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(email) WHERE email IS NOT NULL;

-- ==========================================
-- PARTE C: Insertar nuevo módulo CRM
-- ==========================================

INSERT INTO modules (name, route_path, icon, category, display_order, is_core, description) VALUES
  ('CRM', '/workspace/crm', 'Briefcase', 'Workspace', 55, false, 'Gestión de empresas clientes y contactos')
ON CONFLICT (route_path) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  is_core = EXCLUDED.is_core,
  description = EXCLUDED.description;

-- Agregar nuevo módulo CRM a los templates que tenían el CRM original (ahora CRM-FOMO)
INSERT INTO template_modules (template_id, module_id)
SELECT tm.template_id, m.id
FROM modules m
CROSS JOIN (
  SELECT DISTINCT template_id
  FROM template_modules
  WHERE module_id = (SELECT id FROM modules WHERE route_path = '/workspace/crm-fomo' LIMIT 1)
) tm
WHERE m.route_path = '/workspace/crm'
ON CONFLICT (template_id, module_id) DO NOTHING;

-- Comentarios
COMMENT ON TABLE crm_contacts IS 'Personas de contacto en empresas clientes. Cada contacto pertenece a un client (empresa cliente) y a un company_id (tenant).';
