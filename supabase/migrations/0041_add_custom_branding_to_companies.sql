-- =============================================
-- MIGRACIÓN 0041: AGREGAR BRANDING PERSONALIZADO A EMPRESAS
-- =============================================
-- Permite a cada empresa configurar colores personalizados para su workspace
-- MIGRACIÓN ADITIVA - SEGURA PARA PRODUCCIÓN

-- =============================================
-- Agregar columnas para branding personalizado
-- =============================================

-- Columna para colores personalizados (primary y accent por modo light/dark)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS custom_colors JSONB DEFAULT NULL;

-- Columna para configuración adicional de tema (extensible para futuro)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT NULL;

-- =============================================
-- Comentarios para documentación
-- =============================================

COMMENT ON COLUMN companies.custom_colors IS 'Colores personalizados por modo (solo primary y accent): { "light": { "primary": "#...", "accent": "#..." }, "dark": { "primary": "#...", "accent": "#..." } }';
COMMENT ON COLUMN companies.theme_config IS 'Configuración adicional del tema (fuentes, radios, sombras, etc.) para extensiones futuras';

-- =============================================
-- Índice GIN para búsquedas rápidas en JSONB
-- =============================================

CREATE INDEX IF NOT EXISTS idx_companies_custom_colors
  ON companies USING GIN (custom_colors);

CREATE INDEX IF NOT EXISTS idx_companies_theme_config
  ON companies USING GIN (theme_config);
