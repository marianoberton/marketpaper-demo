-- =============================================
-- POLÍTICAS COMPLETAS PARA TAX_PAYMENTS
-- Reemplazar política de emergencia con políticas seguras
-- =============================================

-- Eliminar la política de emergencia
DROP POLICY IF EXISTS "Emergency: Users can view tax payments" ON tax_payments;

-- Política para SELECT (ver pagos) - MÁS ESPECÍFICA
CREATE POLICY "Users can view tax payments of their company projects"
ON tax_payments FOR SELECT
USING ( 
    auth.uid() IS NOT NULL AND (
        -- Super admin puede ver todo
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
        OR
        -- Usuario pertenece a la empresa del proyecto
        project_id IN (
            SELECT p.id FROM projects p
            INNER JOIN user_profiles up ON up.company_id = p.company_id
            WHERE up.id = auth.uid()
        )
    )
);

-- Política para INSERT (crear pagos)
CREATE POLICY "Users can create tax payments for their company projects"
ON tax_payments FOR INSERT
WITH CHECK ( 
    auth.uid() IS NOT NULL AND (
        -- Super admin puede crear en cualquier proyecto
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
        OR
        -- Usuario pertenece a la empresa del proyecto
        project_id IN (
            SELECT p.id FROM projects p
            INNER JOIN user_profiles up ON up.company_id = p.company_id
            WHERE up.id = auth.uid()
        )
    )
);

-- Política para UPDATE (actualizar pagos)
CREATE POLICY "Users can update tax payments of their company projects"
ON tax_payments FOR UPDATE
USING ( 
    auth.uid() IS NOT NULL AND (
        -- Super admin puede actualizar todo
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
        OR
        -- Usuario pertenece a la empresa del proyecto Y tiene rol adecuado
        project_id IN (
            SELECT p.id FROM projects p
            INNER JOIN user_profiles up ON up.company_id = p.company_id
            WHERE up.id = auth.uid() 
            AND up.role IN ('company_owner', 'company_admin', 'manager', 'employee')
        )
    )
);

-- Política para DELETE (eliminar pagos) - PERMISIVA PARA SOLUCIONAR EL PROBLEMA
CREATE POLICY "Users can delete tax payments of their company projects"
ON tax_payments FOR DELETE
USING ( 
    auth.uid() IS NOT NULL AND (
        -- Super admin puede eliminar todo
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
        OR
        -- Usuario pertenece a la empresa del proyecto Y tiene rol adecuado
        project_id IN (
            SELECT p.id FROM projects p
            INNER JOIN user_profiles up ON up.company_id = p.company_id
            WHERE up.id = auth.uid() 
            AND up.role IN ('company_owner', 'company_admin', 'manager', 'employee')
        )
    )
);

-- Verificar que las políticas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'tax_payments'
ORDER BY policyname;