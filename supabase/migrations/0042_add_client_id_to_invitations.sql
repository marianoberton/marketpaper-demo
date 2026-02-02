-- =============================================
-- MIGRACIÓN 0042: AGREGAR CLIENT_ID A INVITACIONES
-- =============================================
-- Permite asociar invitaciones de tipo viewer con un cliente específico
-- para que al aceptar la invitación se asigne automáticamente el client_id
-- MIGRACIÓN ADITIVA - SEGURA PARA PRODUCCIÓN

-- =============================================
-- Agregar columna client_id a company_invitations
-- =============================================

ALTER TABLE company_invitations
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- =============================================
-- Índice para búsquedas por client_id
-- =============================================

CREATE INDEX IF NOT EXISTS idx_company_invitations_client_id
  ON company_invitations(client_id);

-- =============================================
-- Comentario para documentación
-- =============================================

COMMENT ON COLUMN company_invitations.client_id IS 'Cliente asociado a la invitación (solo para invitaciones con target_role=viewer). Al aceptar, se asigna este client_id al user_profile.';
