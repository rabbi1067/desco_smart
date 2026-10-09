-- =============================================================================
-- DESCO SMART — Core schema
-- Migration 0001: tables, indexes, constraints, triggers
--
-- Apply with:  supabase db push        (or paste into the SQL editor)
-- RLS policies live in 0002_rls_policies.sql and MUST be applied too.
-- No demo/seed rows are created by design.
-- =============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('user', 'super_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type meter_status as enum ('healthy', 'low', 'critical', 'checking', 'error', 'disabled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type alert_type as enum ('low_balance', 'critical_balance', 'recovery');
exception when duplicate_object then null; end $$;

do $$ begin
  create type alert_delivery_status as enum ('pending', 'sent', 'failed', 'skipped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum ('low_balance', 'critical_balance', 'recovery', 'system', 'monitoring_error');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reading_source as enum ('scheduled', 'manual', 'import');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reading_status as enum ('success', 'failed');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- profiles — 1:1 with auth.users
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  email         text not null,
  role          user_role not null default 'user',
  avatar_url    text,
  phone         text,
  address       text,
  designation   text,
  language      text not null default 'en' check (language in ('en', 'bn')),
  theme         text not null default 'dark' check (theme in ('light', 'dark', 'system')),
  timezone      text not null default 'Asia/Dhaka',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists profiles_role_idx  on public.profiles (role);
create index if not exists profiles_email_idx on public.profiles (lower(email));

-- -----------------------------------------------------------------------------
-- meters — one user owns many meters
-- -----------------------------------------------------------------------------
create table if not exists public.meters (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references public.profiles(id) on delete cascade,
  name                      text not null check (char_length(trim(name)) between 1 and 80),
  meter_number              text not null check (char_length(trim(meter_number)) between 4 and 32),
  account_number            text not null check (char_length(trim(account_number)) between 4 and 32),
  threshold                 numeric(12,2) not null default 300 check (threshold >= 0 and threshold <= 100000),
  critical_threshold        numeric(12,2) not null default 100 check (critical_threshold >= 0),
  current_balance           numeric(12,2),
  status                    meter_status not null default 'checking',
  monitoring_enabled        boolean not null default true,
  email_alert_enabled       boolean not null default true,
  last_checked_at           timestamptz,
  last_error                text,
  -- Metadata synced from the DESCO API (read-only from the app's perspective).
  customer_name             text,
  installation_address      text,
  tariff_solution           text,
  sanction_load             numeric(10,2),
  phase_type                text,
  current_month_consumption numeric(12,2),
  reading_time              timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  -- Critical must sit strictly below the low threshold or the states collapse.
  constraint meters_threshold_order check (critical_threshold < threshold),
  -- The same physical meter may only be registered once per user.
  constraint meters_unique_per_user unique (user_id, meter_number)
);

create index if not exists meters_user_id_idx    on public.meters (user_id);
create index if not exists meters_status_idx     on public.meters (status);
create index if not exists meters_monitoring_idx on public.meters (monitoring_enabled) where monitoring_enabled = true;
create index if not exists meters_number_idx     on public.meters (meter_number);

-- -----------------------------------------------------------------------------
-- balance_readings — append-only time series, one row per successful poll
-- -----------------------------------------------------------------------------
create table if not exists public.balance_readings (
  id                        uuid primary key default gen_random_uuid(),
  meter_id                  uuid not null references public.meters(id) on delete cascade,
  balance                   numeric(12,2) not null,
  reading_time              timestamptz,
  current_month_consumption numeric(12,2),
  checked_at                timestamptz not null default now(),
  source                    reading_source not null default 'scheduled',
  status                    reading_status not null default 'success',
  error_message             text
);

-- Composite index drives the "history for meter X, newest first" query.
create index if not exists balance_readings_meter_time_idx
  on public.balance_readings (meter_id, checked_at desc);

-- -----------------------------------------------------------------------------
-- alerts — a threshold breach that warranted notifying the owner
-- -----------------------------------------------------------------------------
create table if not exists public.alerts (
  id            uuid primary key default gen_random_uuid(),
  meter_id      uuid not null references public.meters(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  type          alert_type not null,
  threshold     numeric(12,2) not null,
  balance       numeric(12,2) not null,
  status        alert_delivery_status not null default 'pending',
  error_message text,
  created_at    timestamptz not null default now(),
  sent_at       timestamptz
);

create index if not exists alerts_user_idx  on public.alerts (user_id, created_at desc);
create index if not exists alerts_meter_idx on public.alerts (meter_id, created_at desc);
-- Supports the cooldown lookup: "latest alert of this type for this meter".
create index if not exists alerts_dedup_idx on public.alerts (meter_id, type, created_at desc);

-- -----------------------------------------------------------------------------
-- notifications — in-app inbox
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  meter_id   uuid references public.meters(id) on delete cascade,
  type       notification_type not null,
  title      text not null,
  message    text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where read = false;

-- -----------------------------------------------------------------------------
-- notification_preferences — 1:1 with profiles
-- -----------------------------------------------------------------------------
create table if not exists public.notification_preferences (
  user_id           uuid primary key references public.profiles(id) on delete cascade,
  email_alerts      boolean not null default true,
  low_balance       boolean not null default true,
  critical_balance  boolean not null default true,
  recovery_alerts   boolean not null default true,
  daily_summary     boolean not null default false,
  updated_at        timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- audit_logs — security/ops trail. Never store secrets in `metadata`.
-- -----------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete set null,
  actor_email text,
  action      text not null,
  entity_type text,
  entity_id   text,
  metadata    jsonb,
  result      text not null default 'success' check (result in ('success','failure')),
  created_at  timestamptz not null default now()
);

create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_user_idx    on public.audit_logs (user_id, created_at desc);
create index if not exists audit_logs_action_idx  on public.audit_logs (action);

-- -----------------------------------------------------------------------------
-- system_settings — admin-tunable key/value config
-- -----------------------------------------------------------------------------
create table if not exists public.system_settings (
  key         text primary key,
  value       text not null,
  description text,
  updated_at  timestamptz not null default now()
);

-- Operational defaults (configuration, not demo data).
insert into public.system_settings (key, value, description) values
  ('default_low_threshold',      '300', 'Default low-balance threshold (BDT) applied to newly added meters'),
  ('default_critical_threshold', '100', 'Default critical-balance threshold (BDT) applied to newly added meters'),
  ('alert_cooldown_hours',       '12',  'Minimum hours between repeat emails while a meter stays in the same alert state'),
  ('monitoring_interval_minutes','360', 'Advisory only — the real cadence is the cron in .github/workflows/desco-monitor.yml'),
  ('maintenance_mode',           'false','Shows a maintenance banner to non-admin users'),
  ('default_language',           'en',  'Default UI language for new accounts'),
  ('default_theme',              'dark','Default UI theme for new accounts')
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------

-- Keep updated_at honest without relying on the application layer.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists meters_set_updated_at on public.meters;
create trigger meters_set_updated_at
  before update on public.meters
  for each row execute function public.set_updated_at();

drop trigger if exists notification_prefs_set_updated_at on public.notification_preferences;
create trigger notification_prefs_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

/*
 * Provisions a profile + default notification preferences whenever a new
 * auth.users row appears. SECURITY DEFINER because the signing-up user has no
 * rights on public.profiles yet.
 *
 * NOTE: role is hardcoded to 'user'. It deliberately does NOT read from
 * raw_user_meta_data, which is attacker-controlled at sign-up — otherwise
 * anyone could self-register as super_admin.
 */
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
    'user'
  )
  on conflict (id) do nothing;

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
