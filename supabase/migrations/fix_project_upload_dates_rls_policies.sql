-- Fix RLS policies for project_upload_dates table
-- The current policies use auth.jwt() ->> 'company_id' which doesn't work
-- because company_id is not included in the JWT token by default.
-- We need to use get_user_company_id() function instead.

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view upload dates from their company" ON project_upload_dates;
DROP POLICY IF EXISTS "Users can insert upload dates for their company projects" ON project_upload_dates;
DROP POLICY IF EXISTS "Users can update upload dates from their company" ON project_upload_dates;
DROP POLICY IF EXISTS "Users can delete upload dates from their company" ON project_upload_dates;
DROP POLICY IF EXISTS "Super admin can manage all upload dates" ON project_upload_dates;

-- Create corrected policies using get_user_company_id() function

-- Política para que los usuarios puedan ver fechas de carga de su compañía
CREATE POLICY "Users can view upload dates from their company" ON project_upload_dates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_upload_dates.project_id
            AND p.company_id = get_user_company_id()
        )
    );

-- Política para que los usuarios puedan insertar fechas de carga en proyectos de su compañía
CREATE POLICY "Users can insert upload dates for their company projects" ON project_upload_dates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_upload_dates.project_id
            AND p.company_id = get_user_company_id()
        )
    );

-- Política para que los usuarios puedan actualizar fechas de carga de su compañía
CREATE POLICY "Users can update upload dates from their company" ON project_upload_dates
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_upload_dates.project_id
            AND p.company_id = get_user_company_id()
        )
    );

-- Política para que los usuarios puedan eliminar fechas de carga de su compañía
CREATE POLICY "Users can delete upload dates from their company" ON project_upload_dates
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_upload_dates.project_id
            AND p.company_id = get_user_company_id()
        )
    );

-- Política especial para super_admin (usando get_user_role() function)
CREATE POLICY "Super admin can manage all upload dates" ON project_upload_dates
    FOR ALL USING (get_user_role() = 'super_admin');