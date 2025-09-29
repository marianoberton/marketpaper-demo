-- =============================================
-- AGREGAR CLIENT_ID A USER_PROFILES
-- =============================================
-- Esta migración permite asociar usuarios viewer a clientes específicos
-- para que puedan ver solo los proyectos de su cliente asignado

-- 1. Agregar columna client_id a user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- 2. Crear índice para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_client_id ON user_profiles(client_id);

-- 3. Comentario para documentación
COMMENT ON COLUMN user_profiles.client_id IS 'Cliente específico asociado al usuario (principalmente para rol viewer)';

-- 4. Actualizar función helper para obtener client_id del usuario
CREATE OR REPLACE FUNCTION get_user_client_id()
RETURNS UUID AS $$
DECLARE
  user_client_id UUID;
BEGIN
  SELECT client_id INTO user_client_id FROM user_profiles WHERE id = auth.uid();
  RETURN user_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Función para verificar si un usuario puede ver un proyecto específico
CREATE OR REPLACE FUNCTION can_view_project(project_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_company_id UUID;
  user_client_id UUID;
  project_company_id UUID;
  project_client_id UUID;
BEGIN
  -- Obtener datos del usuario actual
  SELECT role, company_id, client_id 
  INTO user_role, user_company_id, user_client_id 
  FROM user_profiles 
  WHERE id = auth.uid();
  
  -- Super admin puede ver todo
  IF user_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Obtener datos del proyecto
  SELECT company_id, client_id 
  INTO project_company_id, project_client_id 
  FROM projects 
  WHERE id = project_id_param;
  
  -- Verificar que el proyecto pertenezca a la misma empresa
  IF user_company_id != project_company_id THEN
    RETURN FALSE;
  END IF;
  
  -- Para usuarios viewer, verificar que tengan acceso al cliente del proyecto
  IF user_role = 'viewer' THEN
    -- Si el usuario viewer tiene client_id asignado, solo puede ver proyectos de ese cliente
    IF user_client_id IS NOT NULL THEN
      RETURN user_client_id = project_client_id;
    ELSE
      -- Si no tiene client_id asignado, no puede ver ningún proyecto
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Para otros roles (company_owner, company_admin, manager, employee), pueden ver todos los proyectos de la empresa
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Actualizar políticas RLS para projects usando la nueva función
DROP POLICY IF EXISTS "Authenticated users can view projects" ON projects;
CREATE POLICY "Authenticated users can view projects"
ON projects FOR SELECT
USING ( 
  public.is_super_admin() OR 
  can_view_project(id)
);

-- 7. Actualizar políticas para project_documents
DROP POLICY IF EXISTS "Authenticated users can view project documents" ON project_documents;
CREATE POLICY "Authenticated users can view project documents"
ON project_documents FOR SELECT
USING ( 
  public.is_super_admin() OR 
  can_view_project(project_id)
);

-- 8. Actualizar políticas para project_sections si existe
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'project_sections') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view project sections" ON project_sections';
    EXECUTE 'CREATE POLICY "Authenticated users can view project sections"
             ON project_sections FOR SELECT
             USING ( 
               public.is_super_admin() OR 
               can_view_project(project_id)
             )';
  END IF;
END $$;

-- 9. Crear constraint para asegurar que solo usuarios viewer tengan client_id
ALTER TABLE user_profiles 
ADD CONSTRAINT check_client_id_only_for_viewers 
CHECK (
  (role = 'viewer' AND client_id IS NOT NULL) OR 
  (role != 'viewer' AND client_id IS NULL) OR
  (role = 'viewer' AND client_id IS NULL)  -- Permitir viewer sin client_id asignado temporalmente
);

-- 10. Función para validar la asignación de client_id
CREATE OR REPLACE FUNCTION validate_user_client_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Si es un usuario viewer con client_id, verificar que el cliente pertenezca a la misma empresa
  IF NEW.role = 'viewer' AND NEW.client_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM clients 
      WHERE id = NEW.client_id 
      AND company_id = NEW.company_id
    ) THEN
      RAISE EXCEPTION 'El cliente debe pertenecer a la misma empresa del usuario';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Crear trigger para validar asignaciones
DROP TRIGGER IF EXISTS validate_client_assignment ON user_profiles;
CREATE TRIGGER validate_client_assignment
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION validate_user_client_assignment();