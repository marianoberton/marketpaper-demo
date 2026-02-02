-- =============================================
-- MIGRACIÓN 0037: EXPANDIR CATEGORÍAS DE MÓDULOS
-- =============================================
-- Permite categorías adicionales como 'Analytics' y agrega campos de control
-- MIGRACIÓN ADITIVA - SEGURA PARA PRODUCCIÓN

-- Eliminar constraint restrictivo y crear uno más flexible
ALTER TABLE modules DROP CONSTRAINT IF EXISTS modules_category_check;

ALTER TABLE modules
  ADD CONSTRAINT modules_category_check
  CHECK (category IN ('Dashboard', 'Workspace', 'Analytics', 'Tools', 'Admin'));

-- Agregar columnas para control de acceso y orden
ALTER TABLE modules
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS allowed_roles TEXT[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS is_core BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_integration VARCHAR(50) DEFAULT NULL;

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_modules_category ON modules(category);
CREATE INDEX IF NOT EXISTS idx_modules_is_core ON modules(is_core) WHERE is_core = true;
CREATE INDEX IF NOT EXISTS idx_modules_display_order ON modules(display_order);

-- Comentarios para documentación
COMMENT ON COLUMN modules.description IS 'Descripción del módulo para tooltips y documentación';
COMMENT ON COLUMN modules.allowed_roles IS 'Roles permitidos para ver el módulo. NULL = todos los roles pueden verlo';
COMMENT ON COLUMN modules.display_order IS 'Orden de visualización en el sidebar (menor número aparece primero)';
COMMENT ON COLUMN modules.is_core IS 'Si es true, el módulo siempre es visible independientemente de la plantilla';
COMMENT ON COLUMN modules.requires_integration IS 'Proveedor de integración requerido (ej: hubspot, openai). NULL = sin requisitos de integración';
