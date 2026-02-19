-- =====================================================
-- MODULO DE TEMAS — FASE 2b: Visual Features
-- =====================================================
-- Migration purely additive. Does not modify or delete existing data.
-- =====================================================

-- 1. Tema-level sequencing/dependencies
ALTER TABLE temas ADD COLUMN IF NOT EXISTS depends_on_tema_id UUID REFERENCES temas(id) ON DELETE SET NULL;
ALTER TABLE temas ADD COLUMN IF NOT EXISTS sequential_order INT;

CREATE INDEX IF NOT EXISTS idx_temas_depends_on ON temas(depends_on_tema_id);
CREATE INDEX IF NOT EXISTS idx_temas_sequential_order ON temas(project_id, sequential_order);

-- 2. Estimated days on tasks (for template planning)
ALTER TABLE tema_tasks ADD COLUMN IF NOT EXISTS dias_estimados INT;

-- 3. Seed "Obra Nueva - Plano Unico" template (19 tasks)
DO $$
DECLARE
    v_company_id UUID;
    v_existing UUID;
BEGIN
    -- Find a company that has tema_types
    SELECT DISTINCT company_id INTO v_company_id
    FROM tema_types
    LIMIT 1;

    IF v_company_id IS NULL THEN
        RAISE NOTICE 'No company with tema_types found. Skipping template seed.';
        RETURN;
    END IF;

    -- Check if already exists
    SELECT id INTO v_existing
    FROM tema_types
    WHERE company_id = v_company_id AND name = 'Obra Nueva - Plano Unico'
    LIMIT 1;

    IF v_existing IS NOT NULL THEN
        RAISE NOTICE 'Template already exists. Skipping.';
        RETURN;
    END IF;

    INSERT INTO tema_types (
        company_id, name, description, color, icon,
        gerencia, categoria, tareas_template, sort_order
    ) VALUES (
        v_company_id,
        'Obra Nueva - Plano Unico',
        'Template completo para tramite de Obra Nueva con plano unico. 19 tareas desde obtencion de planos hasta seguimiento post-presentacion.',
        '#4F46E5',
        'building',
        'construccion',
        'Permisos',
        '[
            {"orden":1,"titulo":"Conseguir Plano de arquitectura en formato .DWG","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":[],"dias_estimados":15},
            {"orden":2,"titulo":"Revisar Plano de arquitectura","tipo":"interna","asignado_default":"gerenta_area","checklist":["Verificar escala","Verificar cotas","Verificar compatibilidad con normativa"],"dias_estimados":3},
            {"orden":3,"titulo":"Conseguir Planos de instalaciones .DWG","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":["Sanitaria","Electrica","Contra incendio"],"dias_estimados":15},
            {"orden":4,"titulo":"Verificar detalles de Instalacion electrica","tipo":"interna","asignado_default":"gerenta_area","checklist":["Planilla cargas y potencias","Planilla y esquema tableros","Esquemas unifilares"],"dias_estimados":3},
            {"orden":5,"titulo":"Verificar detalles de Instalacion sanitaria","tipo":"interna","asignado_default":"gerenta_area","checklist":["Detalle colector","Cuadro resumen bajadas AF/AC","Cuadro resumen cloacal/pluvial","Calculo RTD","Calculo tanque ralentizacion pluvial"],"dias_estimados":3},
            {"orden":6,"titulo":"Verificar detalles de Instalacion contra incendio","tipo":"interna","asignado_default":"gerenta_area","checklist":["Calculo evacuacion humos/gases","Calculo presurizacion escalera","Memoria descriptiva"],"dias_estimados":3},
            {"orden":7,"titulo":"Conseguir Plano estructural .DWG","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":[],"dias_estimados":15},
            {"orden":8,"titulo":"Conseguir Memoria de calculo estructural","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":[],"dias_estimados":15},
            {"orden":9,"titulo":"Conseguir Estudio de suelos","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":[],"dias_estimados":20},
            {"orden":10,"titulo":"Conseguir Encomiendas profesionales certificadas","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":["Proyectista","Proyectista estructural (calculista)","Proy. inst. sanitaria","Proy. inst. electrica","Proy. prevencion incendio"],"dias_estimados":20},
            {"orden":11,"titulo":"Conseguir Informe de Dominio Actualizado","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":[],"dias_estimados":15},
            {"orden":12,"titulo":"Gestionar Boleta + Comprobante de pago Derechos Construccion Sustentable","tipo":"interna","asignado_default":"gerenta_area","checklist":[],"dias_estimados":5},
            {"orden":13,"titulo":"Conseguir DDJJ instalaciones firmada por profesional","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":[],"dias_estimados":10},
            {"orden":14,"titulo":"Gestionar Apoderamiento TAD","tipo":"interna","asignado_default":"gerenta_area","checklist":[],"dias_estimados":5},
            {"orden":15,"titulo":"Obtener Disposicion DGIUR (si aplica)","tipo":"interna","asignado_default":"gerenta_area","checklist":[],"dias_estimados":30},
            {"orden":16,"titulo":"Conseguir Estatutos societarios (si aplica)","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":[],"dias_estimados":10},
            {"orden":17,"titulo":"Compilar y verificar documentacion completa","tipo":"interna","asignado_default":"gerenta_area","checklist":["Verificar que todos los docs esten presentes y correctos"],"dias_estimados":2},
            {"orden":18,"titulo":"Presentar ante organismo","tipo":"interna","asignado_default":"gerenta_area","checklist":[],"dias_estimados":1},
            {"orden":19,"titulo":"Seguimiento post-presentacion","tipo":"interna","asignado_default":"gerenta_area","checklist":[],"dias_estimados":30}
        ]'::jsonb,
        0
    );

    RAISE NOTICE 'Template "Obra Nueva - Plano Unico" created for company %', v_company_id;
END $$;
