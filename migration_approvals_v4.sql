-- ============================================================
-- KEYSTONE — v4 Approvals Schema Migration
-- Covers:
--   1. due_date date (optional due date for approval request)
--   2. submission_notes text (architect's initial submission comments)
-- Safe to run on an existing database — all changes are additive.
-- ============================================================

ALTER TABLE public.approvals ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE public.approvals ADD COLUMN IF NOT EXISTS submission_notes text;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
