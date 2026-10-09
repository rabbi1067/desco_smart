-- =============================================================================
-- DESCO SMART — Promote a user to Super Admin
--
-- TARGET: fazlerabbicse65@gmail.com
--
-- PREREQUISITES (must be true before this does anything):
--   1. The schema is applied — run 0001_init_schema.sql then 0002_rls_policies.sql.
--   2. This email has ALREADY REGISTERED an account in the app. The profile row
--      is created automatically (by the on_auth_user_created trigger) the moment
--      the account signs up, with role = 'user'. This script flips it to
--      super_admin. If the account has not registered yet, the UPDATE affects
--      0 rows — register first, then run this again.
--
-- HOW TO USE: paste into the Supabase SQL editor and run.
-- =============================================================================

-- 1) Promote (case-insensitive match; uses the lower(email) index).
update public.profiles
set role = 'super_admin'
where lower(email) = lower('fazlerabbicse65@gmail.com');

-- 2) Verify. Expect ONE row with role = super_admin.
--    ZERO rows here means that email has not registered an account yet —
--    sign up in the app first, then re-run step 1.
select id, email, role, is_active, created_at
from public.profiles
where lower(email) = lower('fazlerabbicse65@gmail.com');
