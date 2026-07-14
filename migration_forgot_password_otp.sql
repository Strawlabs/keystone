-- ==========================================
-- KEYSTONE MIGRATION: Forgot Password OTP verification columns
-- Adds reset_otp and reset_otp_expires_at columns to public.users table
-- ==========================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reset_otp text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reset_otp_expires_at timestamp with time zone;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
