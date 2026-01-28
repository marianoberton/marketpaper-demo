-- Sembrar un tema con actividad vieja para la compañía INTED
DO $$
DECLARE
    v_company_id UUID := '57bffb9f-78ba-4252-a9ea-10adf83c3155';
    v_user_id UUID;
    v_type_id UUID;
    v_area_id UUID;
BEGIN
    -- Validamos que la empresa exista
    IF EXISTS (SELECT 1 FROM companies WHERE id = v_company_id) THEN
        -- Obtenemos un usuario de esa empresa
        SELECT id INTO v_user_id FROM user_profiles WHERE company_id = v_company_id LIMIT 1;
        
        -- Obtenemos un tipo y un área (o creamos uno si no hay)
        SELECT id INTO v_type_id FROM tema_types LIMIT 1;
        SELECT id INTO v_area_id FROM tema_areas WHERE company_id = v_company_id LIMIT 1;

        IF v_user_id IS NOT NULL THEN
            -- Insertar un tema con fecha de hace 10 días
            INSERT INTO temas (
                company_id,
                title,
                description,
                status,
                priority,
                type_id,
                area_id,
                created_by,
                updated_at,
                created_at
            ) VALUES (
                v_company_id,
                'Tema de Prueba INTED (Inactivo)',
                'Este tema se creó para INTED con una fecha antigua para probar el semáforo de actividad.',
                'seguimiento',
                'media',
                v_type_id,
                v_area_id,
                v_user_id,
                NOW() - INTERVAL '10 days',
                NOW() - INTERVAL '15 days'
            );
        END IF;
    END IF;
END $$;
