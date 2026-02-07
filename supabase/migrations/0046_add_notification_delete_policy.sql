-- =============================================
-- MIGRACIÓN 0046: Agregar política DELETE para notificaciones
-- =============================================
-- MIGRACIÓN ADITIVA - SEGURA PARA PRODUCCIÓN
-- Permite a los usuarios eliminar sus propias notificaciones

CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    USING (user_id = auth.uid());
