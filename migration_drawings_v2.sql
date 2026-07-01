-- ============================================================
-- KEYSTONE DRAWING LIBRARY — v2 Migration
-- Run this against your Supabase SQL editor.
-- All changes are additive and backward-compatible.
-- ============================================================

-- 1. Drop old category CHECK constraint and add new one with expanded categories
--    (site_photos, project_documents added per P0 spec)
ALTER TABLE public.drawings
  DROP CONSTRAINT IF EXISTS drawings_category_check;

ALTER TABLE public.drawings
  ADD CONSTRAINT drawings_category_check
  CHECK (category IN (
    'architectural',
    'structural',
    'interior',
    'electrical',
    'plumbing',
    'elevation',
    'miscellaneous',
    'site_photos',
    'project_documents'
  ));

-- 2. Add drawing_number column (optional identifier like "DWG-001")
ALTER TABLE public.drawings
  ADD COLUMN IF NOT EXISTS drawing_number text;

-- 3. Add storage_path column to store private bucket path
--    (replaces public URL for secure signed-URL generation)
ALTER TABLE public.drawings
  ADD COLUMN IF NOT EXISTS storage_path text;

-- 4. Add storage_path to drawing_versions too
ALTER TABLE public.drawing_versions
  ADD COLUMN IF NOT EXISTS storage_path text;

-- 5. Index for fast name + drawing_number search
CREATE INDEX IF NOT EXISTS idx_drawings_tenant_name
  ON public.drawings (tenant_id, name);

CREATE INDEX IF NOT EXISTS idx_drawings_tenant_project
  ON public.drawings (tenant_id, project_id);

CREATE INDEX IF NOT EXISTS idx_drawings_drawing_number
  ON public.drawings (tenant_id, drawing_number);

-- Done
SELECT 'Drawing Library v2 migration complete.' AS status;
