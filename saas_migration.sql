-- 1. Add super admin flag to users (first user will be made super admin automatically)
alter table public.users add column if not exists is_super_admin boolean default false;

-- Make the very first created user the super admin
update public.users
set is_super_admin = true
where id = (
    select id from public.users
    order by created_at asc
    limit 1
);

-- 2. Add tenant settings and storage foundation columns
alter table public.tenants add column if not exists notification_preferences jsonb default '{"approvalRequests": true, "taskAssigned": true, "drawingUploaded": true, "siteLogAdded": false}'::jsonb;
alter table public.tenants add column if not exists timezone text default 'UTC';
alter table public.tenants add column if not exists date_format text default 'YYYY-MM-DD';
alter table public.tenants add column if not exists storage_used_bytes bigint default 0;

-- Refresh PostgREST schema cache
notify pgrst, 'reload schema';
