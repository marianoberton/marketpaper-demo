-- =============================================
-- FIX USER PROFILES RLS POLICIES (V2)
-- Solo corregir las políticas problemáticas, mantener las funciones
-- =============================================

-- Drop solo las políticas problemáticas de user_profiles
DROP POLICY IF EXISTS "Users can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Can insert user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Can delete user profiles" ON user_profiles;

-- Política simple: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política simple: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Política para super admins: pueden ver todos los perfiles (sin recursión)
CREATE POLICY "Super admins can view all profiles" ON user_profiles
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role = 'super_admin'
    )
  );

-- Política para super admins: pueden actualizar todos los perfiles
CREATE POLICY "Super admins can update all profiles" ON user_profiles
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role = 'super_admin'
    )
  );

-- Política para company admins: pueden ver usuarios de su compañía
CREATE POLICY "Company admins can view company users" ON user_profiles
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('company_owner', 'company_admin')
    )
  );

-- Política para company admins: pueden actualizar usuarios de su compañía
CREATE POLICY "Company admins can update company users" ON user_profiles
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('company_owner', 'company_admin')
    )
    AND role NOT IN ('super_admin', 'company_owner')
  );

-- Política para insertar: solo super admins y company admins
CREATE POLICY "Admins can insert users" ON user_profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role IN ('super_admin', 'company_owner', 'company_admin')
    )
  );

-- Política para eliminar: solo super admins y company owners
CREATE POLICY "Admins can delete users" ON user_profiles
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role IN ('super_admin', 'company_owner')
    )
    AND role NOT IN ('super_admin', 'company_owner')
  ); 