-- =====================================================
-- MODULO DE TEMAS — Templates Adicionales (Fase 3)
-- =====================================================
-- Purely additive: inserts only if templates don't exist yet.
-- =====================================================

DO $$
DECLARE
    v_company_id UUID;
BEGIN
    -- Find the company that already has tema_types (same as migration 0056)
    SELECT DISTINCT company_id INTO v_company_id
    FROM tema_types
    LIMIT 1;

    IF v_company_id IS NULL THEN
        RAISE NOTICE 'No company with tema_types found. Skipping template seed.';
        RETURN;
    END IF;

    -- =====================================================
    -- Template 2: Conforme de Obra
    -- =====================================================
    IF NOT EXISTS (SELECT 1 FROM tema_types WHERE company_id = v_company_id AND name = 'Conforme de Obra') THEN
        INSERT INTO tema_types (company_id, name, description, color, icon, gerencia, categoria, tareas_template, sort_order)
        VALUES (
            v_company_id,
            'Conforme de Obra',
            'Template para tramite de Conforme de Obra. Documentacion post-construccion para regularizar la obra ejecutada.',
            '#059669',
            'building-2',
            'construccion',
            'Conformes',
            '[
                {"orden":1,"titulo":"Conseguir Planos As-Built en formato .DWG","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":["Arquitectura","Estructural","Instalaciones"],"dias_estimados":20},
                {"orden":2,"titulo":"Verificar diferencias con plano original aprobado","tipo":"interna","asignado_default":"gerenta_area","checklist":["Comparar con plano aprobado","Identificar modificaciones","Verificar que modificaciones son conformables"],"dias_estimados":3},
                {"orden":3,"titulo":"Conseguir Encomiendas profesionales de As-Built","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":["Proyectista arquitectura","Proyectista estructural","Proyectista instalaciones"],"dias_estimados":15},
                {"orden":4,"titulo":"Conseguir Informe de Dominio Actualizado","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":[],"dias_estimados":10},
                {"orden":5,"titulo":"Conseguir Certificado Final de Obra (si existe)","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":[],"dias_estimados":10},
                {"orden":6,"titulo":"Gestionar Apoderamiento TAD","tipo":"interna","asignado_default":"gerenta_area","checklist":[],"dias_estimados":3},
                {"orden":7,"titulo":"Gestionar Boleta + Pago derechos conforme","tipo":"interna","asignado_default":"gerenta_area","checklist":[],"dias_estimados":3},
                {"orden":8,"titulo":"Conseguir DDJJ de instalaciones firmada","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":[],"dias_estimados":10},
                {"orden":9,"titulo":"Compilar y verificar documentacion completa","tipo":"interna","asignado_default":"gerenta_area","checklist":["Planos As-Built","Encomiendas","Informe de dominio","DDJJ instalaciones","Comprobante de pago"],"dias_estimados":2},
                {"orden":10,"titulo":"Presentar ante DGROC","tipo":"interna","asignado_default":"gerenta_area","checklist":[],"dias_estimados":1},
                {"orden":11,"titulo":"Seguimiento y obtencion del Conforme","tipo":"interna","asignado_default":"gerenta_area","checklist":[],"dias_estimados":45}
            ]'::jsonb,
            1
        );
        RAISE NOTICE 'Template "Conforme de Obra" created.';
    END IF;

    -- =====================================================
    -- Template 3: Licitacion Publica
    -- =====================================================
    IF NOT EXISTS (SELECT 1 FROM tema_types WHERE company_id = v_company_id AND name = 'Licitacion Publica') THEN
        INSERT INTO tema_types (company_id, name, description, color, icon, gerencia, categoria, tareas_template, sort_order)
        VALUES (
            v_company_id,
            'Licitacion Publica',
            'Template para preparacion y presentacion de Licitaciones Publicas. Desde lectura de pliego hasta presentacion de oferta.',
            '#7C3AED',
            'gavel',
            'licitaciones',
            'Licitaciones',
            '[
                {"orden":1,"titulo":"Conseguir y leer Pliego de Bases y Condiciones","tipo":"interna","asignado_default":"gerenta_area","checklist":["Verificar fecha de presentacion","Verificar requisitos tecnicos","Verificar requisitos economicos","Identificar documentacion requerida"],"dias_estimados":3},
                {"orden":2,"titulo":"Evaluar viabilidad y decision de participar","tipo":"interna","asignado_default":"gerenta_area","checklist":["Capacidad tecnica","Capacidad economica","Rentabilidad estimada"],"dias_estimados":2},
                {"orden":3,"titulo":"Conseguir Certificados de capacidad (RNCOP/RIUPP)","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":["RNCOP actualizado","RIUPP actualizado","Certificado fiscal"],"dias_estimados":10},
                {"orden":4,"titulo":"Preparar documentacion societaria","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":["Estatuto social","Acta de designacion de autoridades","Poder del firmante"],"dias_estimados":7},
                {"orden":5,"titulo":"Preparar oferta economica","tipo":"interna","asignado_default":"gerenta_area","checklist":["Planilla de computo y presupuesto","Analisis de precios unitarios","Curva de inversion"],"dias_estimados":7},
                {"orden":6,"titulo":"Preparar oferta tecnica","tipo":"interna","asignado_default":"gerenta_area","checklist":["Plan de trabajo","Metodologia constructiva","CV de profesionales","Antecedentes de obras similares"],"dias_estimados":5},
                {"orden":7,"titulo":"Conseguir Garantia de mantenimiento de oferta","tipo":"interna","asignado_default":"gerenta_area","checklist":[],"dias_estimados":3},
                {"orden":8,"titulo":"Compilar y verificar sobre completo","tipo":"interna","asignado_default":"gerenta_area","checklist":["Verificar foliado","Verificar firmas","Verificar sellos","Verificar todos los documentos"],"dias_estimados":1},
                {"orden":9,"titulo":"Presentar oferta en fecha y hora establecida","tipo":"interna","asignado_default":"gerenta_area","checklist":[],"dias_estimados":1},
                {"orden":10,"titulo":"Asistir al acto de apertura","tipo":"interna","asignado_default":"gerenta_area","checklist":["Registrar valores de competidores"],"dias_estimados":1},
                {"orden":11,"titulo":"Seguimiento del proceso de adjudicacion","tipo":"interna","asignado_default":"gerenta_area","checklist":[],"dias_estimados":30}
            ]'::jsonb,
            2
        );
        RAISE NOTICE 'Template "Licitacion Publica" created.';
    END IF;

    -- =====================================================
    -- Template 4: Habilitacion Comercial
    -- =====================================================
    IF NOT EXISTS (SELECT 1 FROM tema_types WHERE company_id = v_company_id AND name = 'Habilitacion Comercial') THEN
        INSERT INTO tema_types (company_id, name, description, color, icon, gerencia, categoria, tareas_template, sort_order)
        VALUES (
            v_company_id,
            'Habilitacion Comercial',
            'Template para obtencion de habilitacion comercial ante AGC. Local comercial, oficina o salon.',
            '#D97706',
            'store',
            'licitaciones',
            'Habilitaciones',
            '[
                {"orden":1,"titulo":"Conseguir Titulo de Propiedad o Contrato de Locacion","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":[],"dias_estimados":7},
                {"orden":2,"titulo":"Conseguir Planos del local en formato .DWG","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":["Planta con medidas","Destino de cada local","Instalaciones"],"dias_estimados":15},
                {"orden":3,"titulo":"Verificar zonificacion y uso permitido (CUAD)","tipo":"interna","asignado_default":"gerenta_area","checklist":["Consultar codigo urbanistico","Verificar que el uso este permitido en la zona"],"dias_estimados":2},
                {"orden":4,"titulo":"Gestionar Certificado de Aptitud Ambiental (si aplica)","tipo":"interna","asignado_default":"gerenta_area","checklist":[],"dias_estimados":20},
                {"orden":5,"titulo":"Conseguir Encomienda profesional de planos","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":[],"dias_estimados":10},
                {"orden":6,"titulo":"Conseguir DDJJ de instalaciones contra incendio","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":[],"dias_estimados":7},
                {"orden":7,"titulo":"Conseguir documentacion del titular","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":["DNI del titular","CUIT","Constancia AFIP","Estatuto societario (si es empresa)"],"dias_estimados":5},
                {"orden":8,"titulo":"Gestionar Apoderamiento TAD","tipo":"interna","asignado_default":"gerenta_area","checklist":[],"dias_estimados":3},
                {"orden":9,"titulo":"Compilar y verificar documentacion completa","tipo":"interna","asignado_default":"gerenta_area","checklist":["Verificar todos los documentos","Verificar vencimientos"],"dias_estimados":1},
                {"orden":10,"titulo":"Presentar solicitud ante AGC","tipo":"interna","asignado_default":"gerenta_area","checklist":[],"dias_estimados":1},
                {"orden":11,"titulo":"Gestionar inspeccion del local","tipo":"interna","asignado_default":"gerenta_area","checklist":["Coordinar fecha con AGC","Acompañar inspector","Registrar observaciones"],"dias_estimados":15},
                {"orden":12,"titulo":"Seguimiento y obtencion del certificado","tipo":"interna","asignado_default":"gerenta_area","checklist":[],"dias_estimados":30}
            ]'::jsonb,
            3
        );
        RAISE NOTICE 'Template "Habilitacion Comercial" created.';
    END IF;

    -- =====================================================
    -- Template 5: Subdivision de Parcela
    -- =====================================================
    IF NOT EXISTS (SELECT 1 FROM tema_types WHERE company_id = v_company_id AND name = 'Subdivision de Parcela') THEN
        INSERT INTO tema_types (company_id, name, description, color, icon, gerencia, categoria, tareas_template, sort_order)
        VALUES (
            v_company_id,
            'Subdivision de Parcela',
            'Template para tramite de subdivision, unificacion o reparcelamiento de parcelas ante AGIP y Catastro.',
            '#DC2626',
            'scissors',
            'construccion',
            'Catastro',
            '[
                {"orden":1,"titulo":"Conseguir Titulo de Propiedad actualizado","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":[],"dias_estimados":10},
                {"orden":2,"titulo":"Conseguir Informe de Dominio e Inhibiciones","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":[],"dias_estimados":10},
                {"orden":3,"titulo":"Conseguir Plano de Mensura vigente","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":[],"dias_estimados":10},
                {"orden":4,"titulo":"Elaborar plano de subdivision en formato .DWG","tipo":"interna","asignado_default":"gerenta_area","checklist":["Poligono de subdivision","Superficies de cada nueva parcela","Cotas y referencias","Cuadro de superficies"],"dias_estimados":5},
                {"orden":5,"titulo":"Encomendar plano ante CPAU","tipo":"interna","asignado_default":"gerenta_area","checklist":[],"dias_estimados":5},
                {"orden":6,"titulo":"Conseguir documentacion de los propietarios","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":["DNI de todos los condominios","Poderes si corresponde"],"dias_estimados":7},
                {"orden":7,"titulo":"Gestionar libre deuda ABL y expensas","tipo":"interna","asignado_default":"gerenta_area","checklist":[],"dias_estimados":5},
                {"orden":8,"titulo":"Gestionar Apoderamiento TAD","tipo":"interna","asignado_default":"gerenta_area","checklist":[],"dias_estimados":3},
                {"orden":9,"titulo":"Presentar ante AGIP - Catastro","tipo":"interna","asignado_default":"gerenta_area","checklist":[],"dias_estimados":1},
                {"orden":10,"titulo":"Seguimiento y aprobacion de plano","tipo":"interna","asignado_default":"gerenta_area","checklist":[],"dias_estimados":60},
                {"orden":11,"titulo":"Escriturar nuevas parcelas (coordinacion con escribano)","tipo":"esperando_cliente","asignado_default":"gerenta_area","checklist":[],"dias_estimados":30}
            ]'::jsonb,
            4
        );
        RAISE NOTICE 'Template "Subdivision de Parcela" created.';
    END IF;

END $$;
