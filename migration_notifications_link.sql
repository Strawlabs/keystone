-- Adds link column to notifications table for "View Related Item" support
alter table public.notifications add column if not exists link text;
