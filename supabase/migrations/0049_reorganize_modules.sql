-- =============================================
-- MIGRACIÓN 0049: REORGANIZAR MÓDULOS DEL WORKSPACE
-- =============================================
-- MIGRACIÓN ADITIVA/LIMPIEZA - SEGURA PARA PRODUCCIÓN
-- 1. Eliminar duplicado de Finanzas (si existe)
-- 2. Eliminar módulo Ventas (rutas eliminadas, reemplazado por Oportunidades)
-- 3. Eliminar módulo Notificaciones del nav (se accede desde la campanita)
-- 4. Eliminar módulo Soporte del nav (se accede desde icono fijo en layout)
-- 5. Reagrupar CRM, CRM-FOMO y Oportunidades bajo categoría "CRM"

-- ==========================================
-- PARTE A: Eliminar duplicado de Finanzas
-- ==========================================
-- Si hay un módulo "Finanzas" con route_path diferente a /workspace/finanzas, eliminarlo

DELETE FROM template_modules WHERE module_id IN (
  SELECT id FROM modules WHERE name = 'Finanzas' AND route_path != '/workspace/finanzas'
);
DELETE FROM modules WHERE name = 'Finanzas' AND route_path != '/workspace/finanzas';

-- ==========================================
-- PARTE B: Eliminar módulo Ventas
-- ==========================================

DELETE FROM template_modules WHERE module_id IN (
  SELECT id FROM modules WHERE route_path = '/workspace/ventas'
);
DELETE FROM modules WHERE route_path = '/workspace/ventas';

-- ==========================================
-- PARTE C: Eliminar módulo Notificaciones del nav
-- ==========================================

DELETE FROM template_modules WHERE module_id IN (
  SELECT id FROM modules WHERE route_path = '/workspace/notifications'
);
DELETE FROM modules WHERE route_path = '/workspace/notifications';

-- ==========================================
-- PARTE D: Eliminar módulo Soporte del nav
-- ==========================================

DELETE FROM template_modules WHERE module_id IN (
  SELECT id FROM modules WHERE route_path = '/workspace/soporte'
);
DELETE FROM modules WHERE route_path = '/workspace/soporte';

-- ==========================================
-- PARTE E: Ampliar constraint de categoría para incluir "CRM"
-- ==========================================

ALTER TABLE modules DROP CONSTRAINT IF EXISTS modules_category_check;
ALTER TABLE modules
  ADD CONSTRAINT modules_category_check
  CHECK (category IN ('Dashboard', 'Workspace', 'Analytics', 'Tools', 'Admin', 'CRM'));

-- ==========================================
-- PARTE F: Reagrupar bajo categoría "CRM"
-- ==========================================

UPDATE modules SET category = 'CRM', display_order = 10
  WHERE route_path = '/workspace/crm';

UPDATE modules SET category = 'CRM', display_order = 20
  WHERE route_path = '/workspace/oportunidades';

UPDATE modules SET category = 'CRM', display_order = 30
  WHERE route_path = '/workspace/crm-fomo';
