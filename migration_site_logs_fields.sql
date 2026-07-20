-- Migration: Site Logs fields enhancement
-- Adds visit_date and location metadata to site_logs table

ALTER TABLE public.site_logs ADD COLUMN IF NOT EXISTS site_status  text;
ALTER TABLE public.site_logs ADD COLUMN IF NOT EXISTS visit_date   timestamp with time zone;
ALTER TABLE public.site_logs ADD COLUMN IF NOT EXISTS location     text;
ALTER TABLE public.site_logs ADD COLUMN IF NOT EXISTS weather       text;
ALTER TABLE public.site_logs ADD COLUMN IF NOT EXISTS workers_count integer;
ALTER TABLE public.site_logs ADD COLUMN IF NOT EXISTS updated_at   timestamp with time zone default timezone('utc'::text, now());

-- Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';
