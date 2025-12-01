-- Migration: Update roles from kajur/kaprodi to jurusan/prodi
-- This migration updates role names to be more generic

-- Update role names in roles table
UPDATE roles SET name = 'jurusan' WHERE name = 'kajur';
UPDATE roles SET name = 'prodi_d3' WHERE name = 'kaprodi_d3';
UPDATE roles SET name = 'prodi_d4' WHERE name = 'kaprodi_d4';
