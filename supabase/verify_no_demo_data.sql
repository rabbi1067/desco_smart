-- =============================================================================
-- DESCO SMART — Database audit: prove there is NO demo / fake / seed data
--
-- HOW TO USE
-- ----------
-- Paste into the Supabase SQL editor and run. It is READ-ONLY (SELECT only).
-- It reports row counts for every user-data table and lists the contents of
-- system_settings so you can confirm the database holds only:
--   * real user data you created yourself while testing, and
--   * the 7 operational configuration rows in system_settings
--     (thresholds, cooldown, defaults) — these are configuration, not demo data.
--
-- The application inserts NO demo/seed rows by design (see the header of
-- 0001_init_schema.sql). A fresh install therefore has 0 rows in every table
-- below except system_settings, which has exactly 7 configuration rows.
-- =============================================================================

-- 1) Row counts for all user-data tables. On a pristine install every count is 0.
select 'profiles'                 as table_name, count(*) as rows from public.profiles
union all select 'meters',                 count(*) from public.meters
union all select 'balance_readings',       count(*) from public.balance_readings
union all select 'alerts',                 count(*) from public.alerts
union all select 'audit_logs',             count(*) from public.audit_logs
union all select 'notifications',          count(*) from public.notifications
union all select 'notification_preferences', count(*) from public.notification_preferences
order by table_name;

-- 2) system_settings should contain ONLY the 7 configuration rows below.
--    Nothing here is demo data — it is the app's operational defaults.
select key, value, description
from public.system_settings
order by key;

-- =============================================================================
-- OPTIONAL — PRISTINE RESET (DESTRUCTIVE; keep commented unless you mean it)
--
-- If you created test accounts/meters while trying the app and want to wipe ALL
-- user data back to a clean slate before go-live, uncomment and run the block
-- below. It removes every row of user data but KEEPS the system_settings
-- configuration. Deleting from auth.users cascades to profiles and the rest.
--
-- This cannot be undone.
-- =============================================================================
-- delete from auth.users;                         -- cascades to profiles, meters, readings, etc.
-- -- Re-assert the 7 config defaults in case any were edited during testing:
-- -- (safe no-op if they are already correct)
-- -- select * from public.system_settings order by key;
