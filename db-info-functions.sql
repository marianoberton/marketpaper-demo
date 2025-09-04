-- Función para obtener información de esquemas
CREATE OR REPLACE FUNCTION public.get_schemas_info()
RETURNS TABLE (
    schema_name text,
    schema_owner text,
    schema_type text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.nspname AS schema_name,
        pg_catalog.pg_get_userbyid(n.nspowner) AS schema_owner,
        CASE 
            WHEN n.nspname LIKE 'pg_%' THEN 'system'
            WHEN n.nspname IN ('information_schema', 'public', 'storage', 'auth') THEN 'core'
            ELSE 'custom'
        END AS schema_type
    FROM pg_catalog.pg_namespace n
    WHERE n.nspname NOT LIKE 'pg_toast%'
    AND n.nspname NOT LIKE 'pg_temp%'
    ORDER BY schema_name;
END;
$$;

-- Función para obtener información de tablas
CREATE OR REPLACE FUNCTION public.get_tables_info()
RETURNS TABLE (
    schema_name text,
    table_name text,
    row_count bigint,
    has_rls boolean,
    rls_policies json
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    WITH table_counts AS (
        SELECT
            c.oid AS table_oid,
            n.nspname AS schema_name,
            c.relname AS table_name,
            pg_catalog.pg_total_relation_size(c.oid) AS total_bytes,
            c.relrowsecurity AS has_rls,
            (SELECT coalesce(json_agg(json_build_object(
                'policy_name', p.polname,
                'cmd', CASE p.polcmd
                    WHEN 'r' THEN 'SELECT'
                    WHEN 'a' THEN 'INSERT'
                    WHEN 'w' THEN 'UPDATE'
                    WHEN 'd' THEN 'DELETE'
                    WHEN '*' THEN 'ALL'
                END,
                'roles', pg_catalog.array_to_string(ARRAY(
                    SELECT rolname 
                    FROM pg_catalog.pg_roles 
                    WHERE oid = ANY(p.polroles)
                ), ', '),
                'using_expr', pg_catalog.pg_get_expr(p.polqual, p.polrelid),
                'with_check_expr', pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid)
            )), '[]'::json)
            FROM pg_catalog.pg_policy p
            WHERE p.polrelid = c.oid) AS rls_policies,
            (SELECT reltuples FROM pg_class WHERE oid = c.oid) AS row_estimate
        FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'r'
        AND n.nspname NOT IN ('pg_catalog', 'information_schema')
    )
    SELECT 
        tc.schema_name,
        tc.table_name,
        tc.row_estimate::bigint AS row_count,
        tc.has_rls,
        tc.rls_policies
    FROM table_counts tc
    ORDER BY tc.schema_name, tc.table_name;
END;
$$;