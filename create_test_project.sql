-- Script para crear proyecto de prueba para test-prefactibilidad
-- Este proyecto es necesario para que funcione la página de test

INSERT INTO projects (
    id,
    company_id,
    name,
    address,
    barrio,
    ciudad,
    surface,
    director_obra,
    builder,
    current_stage,
    project_type,
    project_usage,
    notes,
    created_at,
    updated_at
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    'test-company',
    'Proyecto de Prueba - Prefactibilidad',
    'Dirección de Prueba 123',
    'Barrio Test',
    'Ciudad Test',
    150.0,
    'Arq. Juan Pérez (Prueba)',
    'Constructora Test SA',
    'Prefactibilidad del proyecto',
    'Obra Mayor',
    'Vivienda',
    'Proyecto creado automáticamente para pruebas de subida directa de archivos',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    barrio = EXCLUDED.barrio,
    ciudad = EXCLUDED.ciudad,
    updated_at = NOW();

-- Crear las secciones predefinidas para este proyecto
INSERT INTO project_sections (project_id, name, "order", icon, is_system)
VALUES 
    ('33333333-3333-3333-3333-333333333333', 'Planos de Proyecto e Instalaciones', 1, '📐', true),
    ('33333333-3333-3333-3333-333333333333', 'Documentación Municipal y Gestoría', 2, '🏛️', true),
    ('33333333-3333-3333-3333-333333333333', 'Servicios Públicos', 3, '⚡', true),
    ('33333333-3333-3333-3333-333333333333', 'Profesionales Intervinientes', 4, '👷', true),
    ('33333333-3333-3333-3333-333333333333', 'Seguros y Documentación Administrativa', 5, '📋', true),
    ('33333333-3333-3333-3333-333333333333', 'Pagos y Comprobantes', 6, '💰', true),
    ('33333333-3333-3333-3333-333333333333', 'Verificaciones - Prefactibilidad del proyecto', 7, '🔍', false)
ON CONFLICT (project_id, name) DO NOTHING;

SELECT 'Proyecto de prueba creado exitosamente' as resultado;