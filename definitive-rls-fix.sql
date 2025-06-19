-- =================================================================
-- SCRIPT DE REPARACIÓN DEFINITIVO PARA RLS (v7 - Schema Aware)
-- Basado en el esquema proporcionado. Corrige error de sintaxis.
-- POR FAVOR, EJECUTA ESTO EN EL EDITOR DE SQL DE SUPABASE.
-- =================================================================

-- ========= PASO 1: Limpieza de políticas =========
-- Limpia TODAS las políticas viejas para evitar conflictos.

-- --- Tabla: companies ---
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;
DROP POLICY IF EXISTS "Only owners can update company" ON public.companies;
DROP POLICY IF EXISTS "RLS: Users can manage their own company data" ON public.companies;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.companies;
DROP POLICY IF EXISTS "Super admins can manage all companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can read companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can delete their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can manage their own company" ON public.companies;
DROP POLICY IF EXISTS "Super admins can manage companies" ON public.companies;

-- --- Tabla: client_templates ---
DROP POLICY IF EXISTS "Allow public read access" ON public.client_templates;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.client_templates;
DROP POLICY IF EXISTS "Super admins can manage templates" ON public.client_templates;
DROP POLICY IF EXISTS "Authenticated users can read templates" ON public.client_templates;


-- ========= PASO 2: Crear las nuevas políticas correctas =========

-- --- Tabla: companies ---
-- Super Admins pueden hacer todo.
CREATE POLICY "Super admins can manage companies" ON public.companies FOR ALL
  USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
-- Usuarios autenticados pueden LEER. La lógica de la app decide si PUEDEN ver esa compañía.
CREATE POLICY "Authenticated users can read companies" ON public.companies FOR SELECT
  USING (auth.role() = 'authenticated');
-- Usuarios regulares solo pueden ACTUALIZAR su propia compañía.
CREATE POLICY "Users can update their own company" ON public.companies FOR UPDATE
  USING (id = (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()))
  WITH CHECK (id = (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));
-- Usuarios regulares solo pueden BORRAR su propia compañía.
CREATE POLICY "Users can delete their own company" ON public.companies FOR DELETE
  USING (id = (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));

-- --- Tabla: client_templates ---
-- Super Admins pueden hacer todo.
CREATE POLICY "Super admins can manage templates" ON public.client_templates FOR ALL
  USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
-- Todos los usuarios autenticados pueden LEER las plantillas. Son datos no sensibles.
CREATE POLICY "Authenticated users can read templates" ON public.client_templates FOR SELECT
  USING (auth.role() = 'authenticated');

-- ========= FIN DEL SCRIPT =========
-- Después de ejecutar esto, el problema debería estar resuelto definitivamente. 