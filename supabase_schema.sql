-- KEYSTONE SAAS DATABASE SCHEMA
-- This script sets up the PostgreSQL database in Supabase for Keystone.
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. TENANTS TABLE
create table public.tenants (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    logo_url text,
    subscription_plan text not null default 'free', -- 'free', 'pro', 'enterprise'
    status text not null default 'active', -- 'active', 'suspended'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on tenants
alter table public.tenants enable row level security;

-- 2. USERS TABLE (Linked to Supabase Auth)
create table public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    tenant_id uuid not null references public.tenants(id) on delete cascade,
    name text not null,
    email text not null unique,
    role text not null check (role in ('admin', 'architect', 'staff', 'client')),
    status text not null default 'active', -- 'active', 'inactive'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on users
alter table public.users enable row level security;

-- 3. PROJECTS TABLE
create table public.projects (
    id uuid primary key default uuid_generate_v4(),
    tenant_id uuid not null references public.tenants(id) on delete cascade,
    name text not null,
    code text not null,
    client_name text not null,
    client_email text,
    location text,
    description text,
    status text not null check (status in ('planning', 'active', 'on_hold', 'completed', 'cancelled')) default 'planning',
    start_date date,
    end_date date,
    created_by uuid references public.users(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (tenant_id, code)
);

-- Enable RLS on projects
alter table public.projects enable row level security;

-- 4. PROJECT MEMBERS TABLE (Team assignments)
create table public.project_members (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid not null references public.projects(id) on delete cascade,
    user_id uuid not null references public.users(id) on delete cascade,
    role text not null check (role in ('admin', 'architect', 'staff', 'client')),
    unique (project_id, user_id)
);

-- Enable RLS on project_members
alter table public.project_members enable row level security;

-- 5. DRAWINGS TABLE
create table public.drawings (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid not null references public.projects(id) on delete cascade,
    tenant_id uuid not null references public.tenants(id) on delete cascade,
    name text not null,
    category text not null check (category in ('architectural', 'structural', 'interior', 'electrical', 'plumbing', 'elevation', 'miscellaneous')),
    file_url text not null,
    current_revision integer not null default 1,
    uploaded_by uuid references public.users(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on drawings
alter table public.drawings enable row level security;

-- 6. DRAWING VERSIONS TABLE (Revisions history)
create table public.drawing_versions (
    id uuid primary key default uuid_generate_v4(),
    drawing_id uuid not null references public.drawings(id) on delete cascade,
    revision_number integer not null,
    revision_notes text,
    file_url text not null,
    uploaded_by uuid references public.users(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (drawing_id, revision_number)
);

-- Enable RLS on drawing_versions
alter table public.drawing_versions enable row level security;

-- 7. APPROVALS TABLE (Client approvals workflow)
create table public.approvals (
    id uuid primary key default uuid_generate_v4(),
    drawing_id uuid not null references public.drawings(id) on delete cascade,
    client_id uuid not null references public.users(id) on delete cascade,
    status text not null check (status in ('pending', 'approved', 'rejected', 'revision_requested')) default 'pending',
    comments text,
    submitted_by uuid references public.users(id) on delete set null,
    submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
    responded_at timestamp with time zone
);

-- Enable RLS on approvals
alter table public.approvals enable row level security;

-- 8. TASKS TABLE
create table public.tasks (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid not null references public.projects(id) on delete cascade,
    tenant_id uuid not null references public.tenants(id) on delete cascade,
    title text not null,
    description text,
    assigned_to uuid references public.users(id) on delete set null,
    priority text not null check (priority in ('low', 'medium', 'high')),
    status text not null check (status in ('pending', 'in_progress', 'completed', 'delayed')) default 'pending',
    due_date date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on tasks
alter table public.tasks enable row level security;

-- 9. SITE LOGS TABLE
create table public.site_logs (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid not null references public.projects(id) on delete cascade,
    tenant_id uuid not null references public.tenants(id) on delete cascade,
    notes text not null,
    created_by uuid references public.users(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on site_logs
alter table public.site_logs enable row level security;

-- 10. SITE LOG PHOTOS TABLE
create table public.site_log_photos (
    id uuid primary key default uuid_generate_v4(),
    site_log_id uuid not null references public.site_logs(id) on delete cascade,
    image_url text not null
);

-- Enable RLS on site_log_photos
alter table public.site_log_photos enable row level security;

-- 11. NOTIFICATIONS TABLE
create table public.notifications (
    id uuid primary key default uuid_generate_v4(),
    tenant_id uuid not null references public.tenants(id) on delete cascade,
    user_id uuid not null references public.users(id) on delete cascade,
    title text not null,
    message text not null,
    type text not null check (type in ('approval_request', 'approval_response', 'task_assigned', 'task_completed', 'drawing_uploaded')),
    is_read boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on notifications
alter table public.notifications enable row level security;

-- 12. ACTIVITY LOGS TABLE
create table public.activity_logs (
    id uuid primary key default uuid_generate_v4(),
    tenant_id uuid not null references public.tenants(id) on delete cascade,
    user_id uuid references public.users(id) on delete set null,
    entity_type text not null, -- 'project', 'drawing', 'task', 'site_log', 'approval', 'auth'
    entity_id uuid,
    action text not null,
    metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on activity_logs
alter table public.activity_logs enable row level security;


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enforces that a user can only access records matching their tenant_id.
-- ==========================================

-- Helper function to get the current user's tenant_id from the users table
create or replace function public.current_user_tenant_id()
returns uuid as $$
  select tenant_id from public.users where id = auth.uid();
$$ language sql security definer;

-- Tenants policy (User can only read their own tenant)
create policy tenant_isolation_tenants on public.tenants
    for all using (id = public.current_user_tenant_id());

-- Users policy
create policy tenant_isolation_users on public.users
    for all using (tenant_id = public.current_user_tenant_id());

-- Projects policy
create policy tenant_isolation_projects on public.projects
    for all using (tenant_id = public.current_user_tenant_id());

-- Project Members policy
create policy tenant_isolation_project_members on public.project_members
    for all using (
        project_id in (select id from public.projects where tenant_id = public.current_user_tenant_id())
    );

-- Drawings policy
create policy tenant_isolation_drawings on public.drawings
    for all using (tenant_id = public.current_user_tenant_id());

-- Drawing Versions policy
create policy tenant_isolation_drawing_versions on public.drawing_versions
    for all using (
        drawing_id in (select id from public.drawings where tenant_id = public.current_user_tenant_id())
    );

-- Approvals policy
create policy tenant_isolation_approvals on public.approvals
    for all using (
        drawing_id in (select id from public.drawings where tenant_id = public.current_user_tenant_id())
    );

-- Tasks policy
create policy tenant_isolation_tasks on public.tasks
    for all using (tenant_id = public.current_user_tenant_id());

-- Site Logs policy
create policy tenant_isolation_site_logs on public.site_logs
    for all using (tenant_id = public.current_user_tenant_id());

-- Site Log Photos policy
create policy tenant_isolation_site_log_photos on public.site_log_photos
    for all using (
        site_log_id in (select id from public.site_logs where tenant_id = public.current_user_tenant_id())
    );

-- Notifications policy
create policy tenant_isolation_notifications on public.notifications
    for all using (tenant_id = public.current_user_tenant_id() and user_id = auth.uid());

-- Activity Logs policy
create policy tenant_isolation_activity_logs on public.activity_logs
    for all using (tenant_id = public.current_user_tenant_id());


-- ==========================================
-- MULTI-TENANT AUTH SYSTEM MIGRATION (NEW)
-- Add columns to tenants and users for custom JWT and password auth
-- ==========================================

-- 1. Extend tenants table with company_email
alter table public.tenants add column if not exists company_email text unique;
alter table public.tenants add column if not exists company_address text;
alter table public.tenants add column if not exists company_number text;

-- 2. Extend users table for custom credentials
alter table public.users add column if not exists password_hash text;
alter table public.users add column if not exists needs_password_change boolean default true;
alter table public.users add column if not exists created_by uuid references public.users(id) on delete set null;
alter table public.users add column if not exists last_login timestamp with time zone;

