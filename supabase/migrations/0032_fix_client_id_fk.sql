-- =====================================================
-- FIX: Correct client_id foreign key reference
-- =====================================================
-- Migration 0030 incorrectly set client_id to reference
-- companies(id) instead of clients(id)
-- =====================================================

-- Drop the incorrect foreign key constraint
ALTER TABLE temas DROP CONSTRAINT IF EXISTS temas_client_id_fkey;

-- Re-add the correct foreign key to clients table
ALTER TABLE temas 
  ADD CONSTRAINT temas_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Also ensure the original migration file is fixed for new deployments
-- (Note: this migration corrects existing databases with the wrong FK)
