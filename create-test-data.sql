-- =============================================
-- SCRIPT PARA CREAR DATOS DE PRUEBA
-- =============================================

-- Insertar empresa de prueba
INSERT INTO companies (id, name, slug, status, created_by) 
VALUES (
  'test-company',
  'Test Company',
  'test-company',
  'active',
  '00000000-0000-0000-0000-000000000000'
) ON CONFLICT (id) DO NOTHING;

-- Insertar cliente de prueba
INSERT INTO clients (id, company_id, name, email, phone, address) 
VALUES (
  'test-client-123',
  'test-company',
  'Cliente de Prueba',
  'cliente@test.com',
  '+1234567890',
  'Dirección de prueba 123'
) ON CONFLICT (id) DO NOTHING;

-- Insertar proyecto de prueba
INSERT INTO projects (
  id,
  company_id,
  client_id,
  name,
  description,
  address,
  status,
  created_at,
  updated_at
) VALUES (
  'test-project-123',
  'test-company',
  'test-client-123',
  'Proyecto de Prueba',
  'Proyecto para pruebas de funcionalidad',
  'Dirección del proyecto de prueba',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insertar secciones del proyecto
INSERT INTO project_sections (id, project_id, name, description, order_index)
VALUES 
  ('section-1', 'test-project-123', 'verificaciones-prefactibilidad-del-proyecto', 'Verificaciones de Prefactibilidad del Proyecto', 1),
  ('section-2', 'test-project-123', 'documentacion-tecnica', 'Documentación Técnica', 2),
  ('section-3', 'test-project-123', 'planos-y-memorias', 'Planos y Memorias', 3)
ON CONFLICT (id) DO NOTHING;

SELECT 'Datos de prueba creados exitosamente' as resultado;