-- =============================================
-- MIGRACIÓN 0038: POBLAR MÓDULOS DEL SISTEMA
-- =============================================
-- Inserta todos los módulos existentes en la plataforma
-- MIGRACIÓN ADITIVA - SEGURA PARA PRODUCCIÓN

-- Eliminar constraint UNIQUE en name si existe (no debe ser único)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'modules_name_unique'
  ) THEN
    ALTER TABLE modules DROP CONSTRAINT modules_name_unique;
  END IF;
END $$;

-- Crear constraint UNIQUE en route_path si no existe (requerido para ON CONFLICT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'modules_route_path_unique'
  ) THEN
    ALTER TABLE modules ADD CONSTRAINT modules_route_path_unique UNIQUE (route_path);
  END IF;
END $$;

-- NOTA: Usamos ON CONFLICT DO UPDATE para idempotencia
-- Si un módulo ya existe por route_path, se actualiza con los nuevos valores

-- ====================
-- MÓDULOS CORE (siempre visibles)
-- ====================

INSERT INTO modules (name, route_path, icon, category, display_order, is_core, description) VALUES
  ('Temas', '/workspace/temas', 'FolderOpen', 'Workspace', 10, true, 'Gestión de expedientes y trabajos'),
  ('Mis Tareas', '/workspace/tareas', 'ListTodo', 'Workspace', 20, true, 'Tus tareas asignadas'),
  ('Cotizador', '/workspace/cotizador', 'Calculator', 'Workspace', 30, true, 'Módulo de cotizaciones'),
  ('Ventas', '/workspace/ventas', 'TrendingUp', 'Workspace', 40, true, 'Pipeline de ventas (Kanban)'),
  ('Soporte', '/workspace/soporte', 'Ticket', 'Workspace', 50, true, 'Tickets de soporte técnico'),
  ('Equipo', '/workspace/settings/users', 'Users', 'Workspace', 90, true, 'Gestión de usuarios')
ON CONFLICT (route_path) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  is_core = EXCLUDED.is_core,
  description = EXCLUDED.description;

-- Equipo solo para admins/owners/managers (INTED requiere que managers vean Equipo)
UPDATE modules
SET allowed_roles = ARRAY['super_admin', 'company_owner', 'company_admin', 'manager']::TEXT[]
WHERE route_path = '/workspace/settings/users';

-- ====================
-- MÓDULOS LEGACY (opcionales, dependen de plantilla)
-- ====================

INSERT INTO modules (name, route_path, icon, category, display_order, is_core, description) VALUES
  ('Overview', '/workspace', 'LayoutDashboard', 'Dashboard', 5, false, 'Panel de resumen y métricas generales'),
  ('CRM', '/workspace/crm', 'Users', 'Workspace', 60, false, 'Gestión de relaciones con clientes'),
  ('Configuración', '/workspace/settings', 'Settings', 'Workspace', 100, false, 'Ajustes del workspace'),
  ('Finanzas', '/workspace/finanzas', 'DollarSign', 'Workspace', 70, false, 'Gestión financiera y gastos'),
  ('Construcción', '/workspace/construccion', 'Hammer', 'Workspace', 65, false, 'Gestión de proyectos de construcción')
ON CONFLICT (route_path) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  is_core = EXCLUDED.is_core,
  description = EXCLUDED.description;

-- ====================
-- MÓDULOS ESPECÍFICOS (requieren integración)
-- ====================

INSERT INTO modules (name, route_path, icon, category, display_order, is_core, requires_integration, description) VALUES
  ('HubSpot', '/workspace/hubspot', 'BarChart3', 'Analytics', 5, false, 'hubspot', 'HubSpot Analytics Dashboard')
ON CONFLICT (route_path) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  is_core = EXCLUDED.is_core,
  requires_integration = EXCLUDED.requires_integration,
  description = EXCLUDED.description;

-- Comentario final
COMMENT ON TABLE modules IS 'Módulos dinámicos del sistema. Los módulos core (is_core=true) siempre son visibles. Los demás dependen de la plantilla asignada a la empresa.';
