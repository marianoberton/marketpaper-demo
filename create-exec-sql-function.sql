-- Crear función RPC para ejecutar SQL desde Node.js
-- IMPORTANTE: Ejecutar este SQL en Supabase Dashboard primero

CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo permitir a usuarios con service_role
  IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: service_role required';
  END IF;
  
  -- Ejecutar la consulta
  EXECUTE sql_query;
  
  RETURN 'Query executed successfully';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$;

-- Otorgar permisos necesarios
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;