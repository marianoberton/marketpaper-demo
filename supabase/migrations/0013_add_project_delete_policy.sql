-- Agregar política de eliminación para proyectos
-- Los usuarios pueden eliminar proyectos de su compañía, super admins pueden eliminar cualquier proyecto

CREATE POLICY "Authenticated users can delete projects"
ON projects FOR DELETE
USING ( 
  public.is_super_admin() OR 
  (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) 
); 