-- ============================================================
-- KEYSTONE — v3 Full Schema Migration
-- Covers:
--   1. Company details (tenants table)
--   2. User auth for all roles (admin, architect, staff, client)
--   3. Storage path fields for all file types
--   4. Site log photo storage_path
--   5. Performance indexes
--   6. RLS policies for new columns
-- Safe to run on an existing database — all changes are additive.
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================


-- ==============================================================
-- SECTION 1: COMPANY / TENANT DETAILS
-- Full company profile for each registered architecture firm
-- ==============================================================

-- Basic company identity
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS company_email    text unique;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS company_address  text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS company_number   text;

-- Extended company profile
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS company_website  text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS company_city     text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS company_state    text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS company_country  text DEFAULT 'India';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS company_pincode  text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS logo_storage_path text; -- bucket path for the firm's logo
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS updated_at       timestamp with time zone default timezone('utc'::text, now());

-- Subscription tracking
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS trial_ends_at    timestamp with time zone;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS max_users        integer DEFAULT 10;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS max_storage_gb   numeric DEFAULT 5;


-- ==============================================================
-- SECTION 2: USER AUTH & PROFILE (All Roles)
-- admin / architect / staff / client
-- ==============================================================

-- Auth credentials (custom JWT auth system)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash          text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS needs_password_change  boolean DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login             timestamp with time zone;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reset_token            text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reset_token_expires_at timestamp with time zone;

-- Who created this user (admin who invited them)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_by  uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Extended profile fields
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone        text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS designation  text;          -- e.g. "Senior Architect", "Site Engineer"
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url   text;          -- public profile photo URL
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_storage_path text;   -- bucket path for avatar
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at   timestamp with time zone default timezone('utc'::text, now());

-- Client-specific: which project they are linked to (informational)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS client_company text;        -- e.g. "Tata Industries"

-- Status tracking
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS invited_at   timestamp with time zone;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS activated_at timestamp with time zone;


-- ==============================================================
-- SECTION 3: DRAWINGS — Storage paths & metadata
-- All drawing files stored in Supabase bucket: keystone-assets
-- Bucket path format: drawings/{tenant_id}/{project_id}/{timestamp}_{filename}
-- ==============================================================

ALTER TABLE public.drawings ADD COLUMN IF NOT EXISTS drawing_number  text;
ALTER TABLE public.drawings ADD COLUMN IF NOT EXISTS storage_path    text;   -- bucket path for secure signed URLs
ALTER TABLE public.drawings ADD COLUMN IF NOT EXISTS file_size_bytes bigint;
ALTER TABLE public.drawings ADD COLUMN IF NOT EXISTS mime_type       text;   -- e.g. application/pdf, image/png
ALTER TABLE public.drawings ADD COLUMN IF NOT EXISTS description     text;
ALTER TABLE public.drawings ADD COLUMN IF NOT EXISTS tags            text[]; -- e.g. ['foundation', 'ground floor']
ALTER TABLE public.drawings ADD COLUMN IF NOT EXISTS updated_at      timestamp with time zone default timezone('utc'::text, now());

-- Update drawings category CHECK to include site_photos and project_documents
ALTER TABLE public.drawings DROP CONSTRAINT IF EXISTS drawings_category_check;
ALTER TABLE public.drawings ADD CONSTRAINT drawings_category_check
  CHECK (category IN (
    'architectural', 'structural', 'interior', 'electrical',
    'plumbing', 'elevation', 'miscellaneous',
    'site_photos', 'project_documents'
  ));


-- ==============================================================
-- SECTION 4: DRAWING VERSIONS — Storage paths
-- Bucket path format: drawings/{tenant_id}/{drawing_id}/v{revision}_{filename}
-- ==============================================================

ALTER TABLE public.drawing_versions ADD COLUMN IF NOT EXISTS storage_path    text;
ALTER TABLE public.drawing_versions ADD COLUMN IF NOT EXISTS file_size_bytes bigint;
ALTER TABLE public.drawing_versions ADD COLUMN IF NOT EXISTS mime_type       text;


-- ==============================================================
-- SECTION 5: SITE LOGS — Storage paths for photos
-- Bucket path format: site-logs/{tenant_id}/{project_id}/{site_log_id}/{timestamp}_{filename}
-- ==============================================================

ALTER TABLE public.site_logs ADD COLUMN IF NOT EXISTS site_status  text;
ALTER TABLE public.site_logs ADD COLUMN IF NOT EXISTS visit_date   timestamp with time zone;
ALTER TABLE public.site_logs ADD COLUMN IF NOT EXISTS location     text;
ALTER TABLE public.site_logs ADD COLUMN IF NOT EXISTS weather       text;
ALTER TABLE public.site_logs ADD COLUMN IF NOT EXISTS workers_count integer;
ALTER TABLE public.site_logs ADD COLUMN IF NOT EXISTS updated_at   timestamp with time zone default timezone('utc'::text, now());

-- Add storage path to site_log_photos (was only storing public image_url)
ALTER TABLE public.site_log_photos ADD COLUMN IF NOT EXISTS storage_path    text;  -- bucket path for signed URLs
ALTER TABLE public.site_log_photos ADD COLUMN IF NOT EXISTS file_size_bytes bigint;
ALTER TABLE public.site_log_photos ADD COLUMN IF NOT EXISTS mime_type       text;
ALTER TABLE public.site_log_photos ADD COLUMN IF NOT EXISTS caption         text;
ALTER TABLE public.site_log_photos ADD COLUMN IF NOT EXISTS uploaded_by     uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.site_log_photos ADD COLUMN IF NOT EXISTS created_at      timestamp with time zone default timezone('utc'::text, now());
ALTER TABLE public.site_log_photos ADD COLUMN IF NOT EXISTS tenant_id       uuid REFERENCES public.tenants(id) ON DELETE CASCADE;


-- ==============================================================
-- SECTION 6: PROJECTS — Extended metadata
-- ==============================================================

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_email    text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS budget          numeric;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS currency        text DEFAULT 'INR';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS cover_storage_path text;  -- bucket path for project cover
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS updated_at      timestamp with time zone default timezone('utc'::text, now());


-- ==============================================================
-- SECTION 7: FILE STORAGE REGISTRY TABLE (NEW)
-- Central registry for every file stored in Supabase Storage.
-- Tracks all uploads regardless of type (drawings, photos, docs).
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.file_uploads (
    id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id        uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    uploaded_by      uuid REFERENCES public.users(id) ON DELETE SET NULL,
    entity_type      text NOT NULL,                    -- 'drawing', 'drawing_version', 'site_log_photo', 'avatar', 'logo', 'project_cover'
    entity_id        uuid,                             -- id of the linked record
    bucket_name      text NOT NULL DEFAULT 'keystone-assets',
    storage_path     text NOT NULL,                    -- full path inside bucket
    file_name        text NOT NULL,                    -- original filename
    file_size_bytes  bigint,
    mime_type        text,
    is_deleted       boolean NOT NULL DEFAULT false,
    deleted_at       timestamp with time zone,
    created_at       timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on file_uploads
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can only see uploads within their tenant
CREATE POLICY tenant_isolation_file_uploads ON public.file_uploads
    FOR ALL USING (tenant_id = public.current_user_tenant_id());


-- ==============================================================
-- SECTION 8: PERFORMANCE INDEXES
-- ==============================================================

-- Tenants
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_company_email  ON public.tenants (company_email);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_tenant_role    ON public.users (tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_users_email          ON public.users (email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_reset_token ON public.users (reset_token) WHERE reset_token IS NOT NULL;

-- Drawings
CREATE INDEX IF NOT EXISTS idx_drawings_tenant_project   ON public.drawings (tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_drawings_tenant_category  ON public.drawings (tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_drawings_tenant_name      ON public.drawings (tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_drawings_drawing_number   ON public.drawings (tenant_id, drawing_number);

-- Site logs
CREATE INDEX IF NOT EXISTS idx_site_logs_tenant_project ON public.site_logs (tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_site_logs_created_by     ON public.site_logs (created_by);

-- Site log photos
CREATE INDEX IF NOT EXISTS idx_site_log_photos_tenant   ON public.site_log_photos (tenant_id);

-- Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_project     ON public.tasks (tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to        ON public.tasks (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status             ON public.tasks (status);

-- File uploads registry
CREATE INDEX IF NOT EXISTS idx_file_uploads_tenant      ON public.file_uploads (tenant_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_entity      ON public.file_uploads (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploader    ON public.file_uploads (uploaded_by);

-- Approvals
CREATE INDEX IF NOT EXISTS idx_approvals_drawing        ON public.approvals (drawing_id);
CREATE INDEX IF NOT EXISTS idx_approvals_client         ON public.approvals (client_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status         ON public.approvals (status);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, is_read);

-- Activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_entity ON public.activity_logs (tenant_id, entity_type, created_at DESC);


-- ==============================================================
-- SECTION 9: RELOAD SCHEMA CACHE
-- Forces Supabase PostgREST to pick up all new columns/tables.
-- ==============================================================

NOTIFY pgrst, 'reload schema';

SELECT 'Keystone v3 migration complete. All tables, columns, indexes, and RLS policies applied.' AS status;
