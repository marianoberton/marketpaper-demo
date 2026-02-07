-- =============================================
-- MIGRACIÓN 0048: AGREGAR MÓDULO NOTIFICACIONES
-- =============================================
-- MIGRACIÓN ADITIVA - SEGURA PARA PRODUCCIÓN

INSERT INTO modules (name, route_path, icon, category, display_order, is_core, description) VALUES
  ('Notificaciones', '/workspace/notifications', 'Bell', 'Workspace', 85, true, 'Centro de notificaciones')
ON CONFLICT (route_path) DO UPDATE SET
  name = EXCLUDED.name,
  is_core = EXCLUDED.is_core,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description;
