-- =============================================================================
-- Migration 0003: Sub-Admin role, Meter Alert Email, and SMTP App Password
-- =============================================================================

-- 1. Add 'admin' to user_role enum if it does not already exist
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add custom per-meter alert email column to meters
ALTER TABLE public.meters ADD COLUMN IF NOT EXISTS alert_email text;

-- 3. Add SMTP configuration keys to system_settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('smtp_host', 'smtp.gmail.com', 'SMTP Server Host (e.g. smtp.gmail.com)'),
  ('smtp_port', '587', 'SMTP Server Port (587 for TLS, 465 for SSL)'),
  ('smtp_user', '', 'SMTP Username / Sender Email (e.g. youremail@gmail.com)'),
  ('smtp_pass', '', 'SMTP App Password (16-character Google/provider app password)'),
  ('smtp_from_name', 'DESCO SMART Alert', 'Sender display name shown in email client'),
  ('smtp_enabled', 'false', 'Enable or disable outgoing email dispatch'),
  ('alert_cooldown_hours', '24', 'Minimum hours between repeat alert emails (24-hour deduplication window)')
ON CONFLICT (key) DO NOTHING;

-- 4. Update is_admin() and is_super_admin() security definer helpers
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 5. RLS policies allowing admin & super_admin access
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "meters_select_admin" ON public.meters;
CREATE POLICY "meters_select_admin"
  ON public.meters FOR SELECT
  TO authenticated
  USING (public.is_admin());
