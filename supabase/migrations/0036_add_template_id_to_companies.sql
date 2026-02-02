-- =============================================
-- MIGRACIÓN 0036: AGREGAR template_id A companies
-- =============================================
-- Vincula empresas con plantillas y arregla FK de template_modules
-- MIGRACIÓN ADITIVA - SEGURA PARA PRODUCCIÓN

-- Agregar columna template_id a companies (nullable por ahora)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES client_templates(id) ON DELETE SET NULL;

-- Índice para mejorar performance de queries por template
CREATE INDEX IF NOT EXISTS idx_companies_template_id ON companies(template_id);

-- Arreglar foreign key de template_modules para referenciar client_templates
-- La migración 0003 referenciabaincorrectamente a 'templates(id)' que no existe
ALTER TABLE template_modules
  DROP CONSTRAINT IF EXISTS template_modules_template_id_fkey;

ALTER TABLE template_modules
  ADD CONSTRAINT template_modules_template_id_fkey
  FOREIGN KEY (template_id) REFERENCES client_templates(id) ON DELETE CASCADE;

-- Comentarios
COMMENT ON COLUMN companies.template_id IS 'Plantilla asignada que define módulos disponibles para esta empresa';
