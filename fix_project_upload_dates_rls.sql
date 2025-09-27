-- Script para corregir las políticas RLS de project_upload_dates
-- El problema es que las políticas usan auth.jwt() ->> 'company_id' pero el JWT no contiene company_id
-- Necesitamos obtener el company_id desde la tabla user_profiles

-- 1. Eliminar las políticas RLS existentes
DROP POLICY IF EXISTS "Users can view upload dates from their company" ON project_upload_dates;
DROP POLICY IF EXISTS "Users can insert upload dates for their company projects" ON project_upload_dates;
DROP POLICY IF EXISTS "Users can update upload dates from their company" ON project_upload_dates;
DROP POLICY IF EXISTS "Users can delete upload dates from their company" ON project_upload_dates;

-- 2. Crear nuevas políticas RLS que obtengan company_id desde user_profiles

-- Política para SELECT: Los usuarios pueden ver fechas de carga de proyectos de su compañía
CREATE POLICY "Users can view upload dates from their company" ON project_upload_dates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN user_profiles up ON up.company_id = p.company_id
            WHERE p.id = project_upload_dates.project_id
            AND up.id = auth.uid()
        )
    );

-- Política para INSERT: Los usuarios pueden insertar fechas de carga en proyectos de su compañía
CREATE POLICY "Users can insert upload dates for their company projects" ON project_upload_dates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN user_profiles up ON up.company_id = p.company_id
            WHERE p.id = project_upload_dates.project_id
            AND up.id = auth.uid()
        )
    );

-- Política para UPDATE: Los usuarios pueden actualizar fechas de carga de su compañía
CREATE POLICY "Users can update upload dates from their company" ON project_upload_dates
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN user_profiles up ON up.company_id = p.company_id
            WHERE p.id = project_upload_dates.project_id
            AND up.id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN user_profiles up ON up.company_id = p.company_id
            WHERE p.id = project_upload_dates.project_id
            AND up.id = auth.uid()
        )
    );

-- Política para DELETE: Los usuarios pueden eliminar fechas de carga de su compañía
CREATE POLICY "Users can delete upload dates from their company" ON project_upload_dates
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN user_profiles up ON up.company_id = p.company_id
            WHERE p.id = project_upload_dates.project_id
            AND up.id = auth.uid()
        )
    );

-- 3. Verificar que las políticas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'project_upload_dates'
ORDER BY policyname;

-- 4. Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'project_upload_dates';

-- 5. Comentarios para documentación
COMMENT ON POLICY "Users can view upload dates from their company" ON project_upload_dates IS 'Permite a los usuarios ver fechas de carga de proyectos de su compañía usando user_profiles.company_id';
COMMENT ON POLICY "Users can insert upload dates for their company projects" ON project_upload_dates IS 'Permite a los usuarios insertar fechas de carga en proyectos de su compañía usando user_profiles.company_id';
COMMENT ON POLICY "Users can update upload dates from their company" ON project_upload_dates IS 'Permite a los usuarios actualizar fechas de carga de su compañía usando user_profiles.company_id';
COMMENT ON POLICY "Users can delete upload dates from their company" ON project_upload_dates IS 'Permite a los usuarios eliminar fechas de carga de su compañía usando user_profiles.company_id';