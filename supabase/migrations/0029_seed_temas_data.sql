-- =====================================================
-- SEED DATA: Áreas y Tipos de Tema
-- =====================================================
-- Esta migración carga datos iniciales para el módulo de Temas
-- Solo se ejecuta si las tablas están vacías
-- =====================================================

-- Función para obtener el company_id de una empresa por nombre
-- (asume que ya existe una empresa creada)
DO $$
DECLARE
    v_company_id UUID;
BEGIN
    -- Buscar una empresa para sembrar datos
    SELECT id INTO v_company_id FROM companies 
    LIMIT 1;

    -- Si no hay empresa, salir
    IF v_company_id IS NULL THEN
        RAISE NOTICE 'No hay empresas activas. Saltando seed data.';
        RETURN;
    END IF;

    -- Solo insertar si no hay áreas para esta empresa
    IF NOT EXISTS (SELECT 1 FROM tema_areas WHERE company_id = v_company_id) THEN
        -- Insertar Áreas
        INSERT INTO tema_areas (company_id, name, color, icon, sort_order) VALUES
            (v_company_id, 'Construcción', '#6366F1', 'building', 1),
            (v_company_id, 'Concesiones BAC', '#8B5CF6', 'briefcase', 2),
            (v_company_id, 'Convenio Marco BAC', '#EC4899', 'handshake', 3);

        RAISE NOTICE 'Áreas creadas para empresa %', v_company_id;
    END IF;

    -- Solo insertar tipos si no hay tipos para esta empresa
    IF NOT EXISTS (SELECT 1 FROM tema_types WHERE company_id = v_company_id) THEN
        -- Insertar Tipos de Tema para Construcción
        INSERT INTO tema_types (company_id, area_id, name, color, sort_order) VALUES
            -- Área: Construcción
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Regularización de Obra en Contravención', '#EF4444', 1),
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Micro Obra Bajo Responsabilidad Profesional', '#F97316', 2),
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Habilitación Comercial / Transferencia', '#F59E0B', 3),
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Consulta de Usos', '#84CC16', 4),
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Plusvalía', '#22C55E', 5),
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Prefactibilidad (Urbanística / Habilitación)', '#14B8A6', 6),
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Regularización de Ventilación Mecánica', '#06B6D4', 7),
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Regularización de Electromecánica', '#3B82F6', 8),
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Varios', '#6B7280', 9),
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Conforme de Arquitectura', '#8B5CF6', 10),
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Registro de Etapa de Proyecto + Permiso de Obra', '#A855F7', 11),
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Permiso de Demolición', '#EC4899', 12),
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Reintegro Derechos Construcción', '#F43F5E', 13),
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Conforme de Incendios', '#EF4444', 14),
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Registro de Plano MH', '#DC2626', 15),
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Consulta Obligatoria DGIUR', '#B91C1C', 16),
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Conforme de Instalación Eléctrica', '#7C3AED', 17),
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Registro de Ventilación Mecánica', '#6D28D9', 18),
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Aviso de Obra', '#4F46E5', 19),
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Permiso de Obra Civil', '#4338CA', 20),
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Certificado Numeración Catastral', '#3730A3', 21),
            (v_company_id, (SELECT id FROM tema_areas WHERE company_id = v_company_id AND name = 'Construcción'), 
             'Consulta Obligatoria (Morfología)', '#312E81', 22);

        RAISE NOTICE 'Tipos de tema creados para empresa %', v_company_id;
    END IF;

END $$;
