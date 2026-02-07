-- =============================================
-- MIGRACIÓN 0045: CRM - Agregar source, tags y photo_url
-- =============================================
-- MIGRACIÓN ADITIVA - SEGURA PARA PRODUCCIÓN
-- 1. Agrega columna source a clients y crm_contacts (origen del contacto/empresa)
-- 2. Agrega columna tags (JSONB) a clients y crm_contacts
-- 3. Agrega columna photo_url a crm_contacts
-- 4. Crea índices para búsqueda eficiente

-- ==========================================
-- PARTE A: Columnas en clients
-- ==========================================

ALTER TABLE clients ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- ==========================================
-- PARTE B: Columnas en crm_contacts
-- ==========================================

ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- ==========================================
-- PARTE C: Índices
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_clients_source ON clients(source) WHERE source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_tags ON clients USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_source ON crm_contacts(source) WHERE source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_contacts_tags ON crm_contacts USING gin(tags);

-- ==========================================
-- Comentarios
-- ==========================================

COMMENT ON COLUMN clients.source IS 'Origen del cliente: referral, web-form, cold-outreach, linkedin, evento, whatsapp, otro';
COMMENT ON COLUMN clients.tags IS 'Array JSON de etiquetas para categorización';
COMMENT ON COLUMN crm_contacts.source IS 'Origen del contacto: referral, web-form, cold-outreach, linkedin, evento, whatsapp, otro';
COMMENT ON COLUMN crm_contacts.tags IS 'Array JSON de etiquetas para categorización';
COMMENT ON COLUMN crm_contacts.photo_url IS 'URL de la foto del contacto en Supabase Storage';
