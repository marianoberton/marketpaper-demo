-- =============================================
-- RESTAURAR VISIBILIDAD DE PAGOS INMEDIATAMENTE
-- Script de emergencia para ver los pagos otra vez
-- =============================================

-- Política SELECT simple y permisiva para ver pagos
CREATE POLICY "Emergency: Users can view tax payments"
ON tax_payments FOR SELECT
USING ( 
    auth.uid() IS NOT NULL
);

-- Verificar que los datos siguen ahí
SELECT COUNT(*) as total_payments_in_db FROM tax_payments;

-- Verificar que la política se creó
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'tax_payments'
ORDER BY policyname;