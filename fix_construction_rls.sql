-- =================================================================
-- Script para corregir las políticas de RLS del Módulo de Construcción
-- =================================================================
-- Este script asume que las tablas 'projects', 'project_sections',
-- y 'project_documents' ya existen por la migración anterior (0004),
-- pero las políticas de seguridad fallaron o son incorrectas.

-- Paso 1: Borrar las políticas antiguas y erróneas para evitar conflictos.
-- Usamos 'IF EXISTS' para que no falle si la política no se llegó a crear.

DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projects;

DROP POLICY IF EXISTS "Authenticated users can view project sections" ON public.project_sections;
DROP POLICY IF EXISTS "Authenticated users can create project sections" ON public.project_sections;

DROP POLICY IF EXISTS "Authenticated users can view project documents" ON public.project_documents;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON public.project_documents;


-- Paso 2: Re-crear las políticas con la lógica correcta, incluyendo el
-- chequeo de superadmin y los nombres de función correctos.

-- Políticas para la tabla 'projects'
CREATE POLICY "Authenticated users can view projects"
ON public.projects FOR SELECT
USING ( public.is_super_admin() OR (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) );

CREATE POLICY "Authenticated users can create projects"
ON public.projects FOR INSERT
WITH CHECK ( public.is_super_admin() OR (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) );

CREATE POLICY "Authenticated users can update projects"
ON public.projects FOR UPDATE
USING ( public.is_super_admin() OR (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) );


-- Políticas para la tabla 'project_sections'
CREATE POLICY "Authenticated users can view project sections"
ON public.project_sections FOR SELECT
USING ( public.is_super_admin() OR (auth.uid() IS NOT NULL AND project_id IN (SELECT id FROM public.projects WHERE company_id = public.get_my_company_id())) );

CREATE POLICY "Authenticated users can create project sections"
ON public.project_sections FOR INSERT
WITH CHECK ( public.is_super_admin() OR (auth.uid() IS NOT NULL AND project_id IN (SELECT id FROM public.projects WHERE company_id = public.get_my_company_id())) );


-- Políticas para la tabla 'project_documents'
CREATE POLICY "Authenticated users can view project documents"
ON public.project_documents FOR SELECT
USING ( public.is_super_admin() OR (auth.uid() IS NOT NULL AND project_id IN (SELECT id FROM public.projects WHERE company_id = public.get_my_company_id())) );

CREATE POLICY "Authenticated users can upload documents"
ON public.project_documents FOR INSERT
WITH CHECK ( public.is_super_admin() OR (auth.uid() IS NOT NULL AND project_id IN (SELECT id FROM public.projects WHERE company_id = public.get_my_company_id())) ); 