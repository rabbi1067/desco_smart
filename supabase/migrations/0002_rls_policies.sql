-- =============================================================================
-- DESCO SMART — Row Level Security
-- Migration 0002: enable RLS + policies for every table
--
-- Model:
--   * A normal user reaches ONLY rows they own.
--   * Ownership of child rows is proven by joining up to meters.user_id.
--   * super_admin gets read access to system-level data (and write where the
--     admin UI genuinely needs it).
--   * The Python monitoring worker uses the service-role key, which bypasses
--     RLS entirely — it is authorised outside this layer.
-- =============================================================================

alter table public.profiles                  enable row level security;
alter table public.meters                    enable row level security;
alter table public.balance_readings          enable row level security;
alter table public.alerts                    enable row level security;
alter table public.notifications             enable row level security;
alter table public.notification_preferences  enable row level security;
alter table public.audit_logs                enable row level security;
alter table public.system_settings           enable row level security;

-- -----------------------------------------------------------------------------
-- Role helper
--
-- SECURITY DEFINER + a direct read of profiles. This is essential: calling it
-- from a policy ON profiles would otherwise re-enter that policy and recurse
-- infinitely. Being SECURITY DEFINER, the function reads past RLS, breaking
-- the cycle. search_path is pinned to defeat search-path hijacking.
-- -----------------------------------------------------------------------------
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'super_admin'
  );
$$;

revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to authenticated;

-- =============================================================================
-- profiles
-- =============================================================================
drop policy if exists "profiles_select_own"    on public.profiles;
drop policy if exists "profiles_select_admin"  on public.profiles;
drop policy if exists "profiles_update_own"    on public.profiles;
drop policy if exists "profiles_update_admin"  on public.profiles;
drop policy if exists "profiles_insert_own"    on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_select_admin"
  on public.profiles for select
  to authenticated
  using (public.is_super_admin());

-- A user may edit their own profile but MUST NOT change their own role.
-- The WITH CHECK re-reads the stored role and requires it to be unchanged,
-- which blocks privilege escalation via a crafted PATCH.
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Normally the handle_new_user trigger inserts the row; this covers backfill.
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- =============================================================================
-- meters
-- =============================================================================
drop policy if exists "meters_select_own"   on public.meters;
drop policy if exists "meters_select_admin" on public.meters;
drop policy if exists "meters_insert_own"   on public.meters;
drop policy if exists "meters_update_own"   on public.meters;
drop policy if exists "meters_update_admin" on public.meters;
drop policy if exists "meters_delete_own"   on public.meters;
drop policy if exists "meters_delete_admin" on public.meters;

create policy "meters_select_own"
  on public.meters for select
  to authenticated
  using (user_id = auth.uid());

create policy "meters_select_admin"
  on public.meters for select
  to authenticated
  using (public.is_super_admin());

-- WITH CHECK forces user_id to be the caller: a forged owner id is rejected
-- by the database even if the application layer were bypassed.
create policy "meters_insert_own"
  on public.meters for insert
  to authenticated
  with check (user_id = auth.uid());

-- USING gates which rows are visible to UPDATE; WITH CHECK gates the result,
-- so a user cannot transfer their meter to another account.
create policy "meters_update_own"
  on public.meters for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "meters_update_admin"
  on public.meters for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "meters_delete_own"
  on public.meters for delete
  to authenticated
  using (user_id = auth.uid());

create policy "meters_delete_admin"
  on public.meters for delete
  to authenticated
  using (public.is_super_admin());

-- =============================================================================
-- balance_readings — ownership is inherited through meters
-- =============================================================================
drop policy if exists "readings_select_own"   on public.balance_readings;
drop policy if exists "readings_select_admin" on public.balance_readings;
drop policy if exists "readings_insert_own"   on public.balance_readings;

create policy "readings_select_own"
  on public.balance_readings for select
  to authenticated
  using (
    exists (
      select 1 from public.meters m
      where m.id = balance_readings.meter_id
        and m.user_id = auth.uid()
    )
  );

create policy "readings_select_admin"
  on public.balance_readings for select
  to authenticated
  using (public.is_super_admin());

-- Permits "Check Now" from the app; the worker writes via service role.
create policy "readings_insert_own"
  on public.balance_readings for insert
  to authenticated
  with check (
    exists (
      select 1 from public.meters m
      where m.id = balance_readings.meter_id
        and m.user_id = auth.uid()
    )
  );

-- Readings are an immutable audit trail: no UPDATE/DELETE policies exist,
-- so those operations are denied to every non-service-role caller.

-- =============================================================================
-- alerts
-- =============================================================================
drop policy if exists "alerts_select_own"   on public.alerts;
drop policy if exists "alerts_select_admin" on public.alerts;

create policy "alerts_select_own"
  on public.alerts for select
  to authenticated
  using (user_id = auth.uid());

create policy "alerts_select_admin"
  on public.alerts for select
  to authenticated
  using (public.is_super_admin());

-- Alerts are generated by the worker (service role) only — intentionally no
-- INSERT policy, so a client cannot fabricate an alert record.

-- =============================================================================
-- notifications
-- =============================================================================
drop policy if exists "notifications_select_own"   on public.notifications;
drop policy if exists "notifications_select_admin" on public.notifications;
drop policy if exists "notifications_update_own"   on public.notifications;
drop policy if exists "notifications_delete_own"   on public.notifications;

create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications_select_admin"
  on public.notifications for select
  to authenticated
  using (public.is_super_admin());

-- Scoped to the owner; used for marking read/unread.
create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications_delete_own"
  on public.notifications for delete
  to authenticated
  using (user_id = auth.uid());

-- =============================================================================
-- notification_preferences
-- =============================================================================
drop policy if exists "notif_prefs_select_own"   on public.notification_preferences;
drop policy if exists "notif_prefs_select_admin" on public.notification_preferences;
drop policy if exists "notif_prefs_upsert_own"   on public.notification_preferences;
drop policy if exists "notif_prefs_update_own"   on public.notification_preferences;

create policy "notif_prefs_select_own"
  on public.notification_preferences for select
  to authenticated
  using (user_id = auth.uid());

create policy "notif_prefs_select_admin"
  on public.notification_preferences for select
  to authenticated
  using (public.is_super_admin());

create policy "notif_prefs_upsert_own"
  on public.notification_preferences for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "notif_prefs_update_own"
  on public.notification_preferences for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =============================================================================
-- audit_logs — readable by the owning user and by admins; never client-writable
-- =============================================================================
drop policy if exists "audit_select_own"   on public.audit_logs;
drop policy if exists "audit_select_admin" on public.audit_logs;

create policy "audit_select_own"
  on public.audit_logs for select
  to authenticated
  using (user_id = auth.uid());

create policy "audit_select_admin"
  on public.audit_logs for select
  to authenticated
  using (public.is_super_admin());

-- No INSERT/UPDATE/DELETE policies: audit rows are written server-side with the
-- service role, so the trail cannot be forged or erased from the browser.

-- =============================================================================
-- system_settings — world-readable to authenticated users, admin-writable
-- =============================================================================
drop policy if exists "settings_select_all"    on public.system_settings;
drop policy if exists "settings_write_admin"   on public.system_settings;
drop policy if exists "settings_update_admin"  on public.system_settings;

create policy "settings_select_all"
  on public.system_settings for select
  to authenticated
  using (true);

create policy "settings_update_admin"
  on public.system_settings for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "settings_write_admin"
  on public.system_settings for insert
  to authenticated
  with check (public.is_super_admin());
