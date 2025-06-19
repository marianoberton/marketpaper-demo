-- migrations/002_revert_add_template_to_company.sql

-- Eliminar la restricción de clave externa
ALTER TABLE public.companies
DROP CONSTRAINT IF EXISTS fk_client_template;

-- Eliminar el índice
DROP INDEX IF EXISTS idx_companies_client_template_id;

-- Eliminar la columna
ALTER TABLE public.companies
DROP COLUMN IF EXISTS client_template_id;

-- Comentario para explicar el cambio
-- Este script revierte la migración 001, eliminando la columna client_template_id
-- y sus objetos asociados de la tabla companies para resolver un conflicto de relaciones múltiples. 