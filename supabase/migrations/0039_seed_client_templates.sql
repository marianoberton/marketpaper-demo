-- =============================================
-- MIGRACIÓN 0039: CREAR PLANTILLAS Y ASIGNAR MÓDULOS
-- =============================================
-- Crea plantillas de ejemplo y las asigna a empresas existentes
-- MIGRACIÓN ADITIVA - SEGURA PARA PRODUCCIÓN

DO $$
DECLARE
  v_template_default_id UUID;
  v_template_premium_id UUID;
  v_template_custom_id UUID;
BEGIN
  -- ==========================================
  -- PLANTILLA 1: Default (para empresas sin plantilla)
  -- ==========================================
  INSERT INTO client_templates (
    name,
    description,
    category,
    max_users,
    max_contacts,
    max_api_calls,
    is_active
  ) VALUES (
    'Default',
    'Plantilla por defecto con módulos core',
    'standard',
    10,
    1000,
    10000,
    true
  ) RETURNING id INTO v_template_default_id;

  -- Asignar todos los módulos CORE a Default
  INSERT INTO template_modules (template_id, module_id)
  SELECT v_template_default_id, id
  FROM modules
  WHERE is_core = true;

  -- ==========================================
  -- PLANTILLA 2: Premium (con CRM + Finanzas + Construcción)
  -- ==========================================
  INSERT INTO client_templates (
    name,
    description,
    category,
    max_users,
    max_contacts,
    max_api_calls,
    monthly_price,
    is_active
  ) VALUES (
    'Premium',
    'Plantilla premium con CRM, Finanzas y Construcción',
    'premium',
    25,
    5000,
    50000,
    299.00,
    true
  ) RETURNING id INTO v_template_premium_id;

  -- Asignar módulos core + adicionales
  INSERT INTO template_modules (template_id, module_id)
  SELECT v_template_premium_id, id
  FROM modules
  WHERE is_core = true
     OR route_path IN ('/workspace/crm', '/workspace/finanzas', '/workspace/construccion', '/workspace');

  -- ==========================================
  -- PLANTILLA 3: MarketPaper Custom (con todos los módulos incluido HubSpot)
  -- ==========================================
  INSERT INTO client_templates (
    name,
    description,
    category,
    max_users,
    max_contacts,
    max_api_calls,
    is_active
  ) VALUES (
    'MarketPaper Custom',
    'Plantilla personalizada para MarketPaper con integración HubSpot',
    'custom',
    50,
    10000,
    100000,
    true
  ) RETURNING id INTO v_template_custom_id;

  -- Asignar TODOS los módulos (core + opcionales + HubSpot)
  INSERT INTO template_modules (template_id, module_id)
  SELECT v_template_custom_id, id
  FROM modules;

  -- ==========================================
  -- ASIGNAR PLANTILLAS A EMPRESAS EXISTENTES
  -- ==========================================

  -- MarketPaper → Custom template (con HubSpot)
  UPDATE companies
  SET template_id = v_template_custom_id
  WHERE id = 'e674f997-04c0-425a-9ce5-d11f812046b8';

  -- INTED → Premium (proteger su configuración actual)
  -- Buscar INTED por nombre (puede ser INTED, inted, Inted, etc.)
  UPDATE companies
  SET template_id = v_template_premium_id
  WHERE name ILIKE '%INTED%';

  -- Resto de empresas → Default
  UPDATE companies
  SET template_id = v_template_default_id
  WHERE template_id IS NULL;

  RAISE NOTICE 'Plantillas creadas y asignadas exitosamente';
  RAISE NOTICE 'Default Template ID: %', v_template_default_id;
  RAISE NOTICE 'Premium Template ID: %', v_template_premium_id;
  RAISE NOTICE 'MarketPaper Custom Template ID: %', v_template_custom_id;

END $$;
