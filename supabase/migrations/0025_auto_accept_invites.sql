-- Función para obtener datos de invitación por token (público/seguro)
-- MANTENEMOS ESTA FUNCIÓN ya que la usa el frontend para mostrar info previa
CREATE OR REPLACE FUNCTION get_invitation_by_token(invite_token UUID)
RETURNS TABLE (
  email VARCHAR,
  company_name VARCHAR,
  role VARCHAR
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.email::VARCHAR,
    c.name::VARCHAR as company_name,
    ci.target_role::VARCHAR as role
  FROM company_invitations ci
  JOIN companies c ON c.id = ci.company_id
  WHERE ci.token = invite_token
  AND ci.status = 'pending'
  AND ci.expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant access to public (anon)
GRANT EXECUTE ON FUNCTION get_invitation_by_token TO anon;
GRANT EXECUTE ON FUNCTION get_invitation_by_token TO authenticated;
GRANT EXECUTE ON FUNCTION get_invitation_by_token TO service_role;

-- REMOVIDO: Trigger handle_new_user_invitation
-- La lógica de aceptación se ha movido al backend (API Route) para mayor estabilidad.
-- Aseguramos que se elimine si existía
DROP TRIGGER IF EXISTS on_auth_user_created_handle_invitation ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_invitation();
