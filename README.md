# DESCO SMART — Prepaid Balance Monitor

Monitor DESCO prepaid electricity balances across **multiple meters per account**, with
automated low-balance alerts, in-app notifications, history charts, and a Super Admin
console. Fully **bilingual (English / বাংলা)**, dark/light/system themes, responsive from
320 → 1920 px, and built accessibility-first.

> **Status:** Application and scheduled monitoring worker are complete and build clean.
> Live balance polling and email delivery require your own Supabase project, DESCO meter
> numbers, and (optionally) an SMTP account — see [Setup](#setup). No credentials ship in
> this repository.

---

## Table of contents

- [Highlights](#highlights)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Setup](#setup)
  - [1. Install](#1-install)
  - [2. Create a Supabase project](#2-create-a-supabase-project)
  - [3. Apply the database schema + RLS](#3-apply-the-database-schema--rls)
  - [4. Configure environment variables](#4-configure-environment-variables)
  - [5. Run the web app](#5-run-the-web-app)
  - [6. Run the monitoring worker](#6-run-the-monitoring-worker)
  - [7. Schedule it on GitHub Actions](#7-schedule-it-on-github-actions)
- [Security model](#security-model)
- [Scripts](#scripts)
- [License](#license)

---

## Highlights

- **Multiple meters per user.** One account adds and manages many meters.
- **Strict per-user isolation.** Enforced at the database with PostgreSQL Row Level
  Security — not merely in the UI. User A can never read User B's meters, readings,
  alerts, or notifications.
- **Automated monitoring.** A scheduled Python worker polls DESCO for every
  monitoring-enabled meter, records a reading time series, and emails owners on
  low/critical balance and on recovery — with de-duplication so the same state is not
  re-sent every run.
- **Honest alert lifecycle.** Alerts are recorded `pending` and only marked `sent` after
  SMTP confirms; otherwise `skipped` or `failed`. Nothing is ever reported as sent that
  was not.
- **Super Admin console.** System stats, user directory, fleet-wide meters, analytics,
  reports/ledger, notifications, audit logs, email-gateway status, and global settings.
- **Bilingual + themeable + accessible.** Centralized typed dictionaries (adding an
  English key forces its Bangla counterpart at compile time), dark/light/system themes,
  keyboard-navigable, ARIA-labeled, status never conveyed by color alone, and animations
  respect `prefers-reduced-motion`.

---

## Tech stack

| Layer            | Technology                                                             |
| ---------------- | --------------------------------------------------------------------- |
| Framework        | Next.js 15 (App Router), React 19, TypeScript 5.7                      |
| Styling / UI     | Tailwind CSS 3.4, shadcn/ui (Radix primitives), Lucide icons          |
| Forms / validation | React Hook Form 7.5 + Zod 3.24 (`@hookform/resolvers`)              |
| Charts           | Recharts 2.15                                                          |
| Theming / i18n   | next-themes, custom typed dictionary (`lib/i18n`)                      |
| Dates            | date-fns 4                                                             |
| Backend / data   | Supabase (Auth + PostgreSQL + Row Level Security) via `@supabase/ssr` |
| Monitoring worker| Python 3.12 standard library + `requests` (see `monitor/`)            |
| Scheduler        | GitHub Actions (cron)                                                  |

---

## Architecture

Two cooperating processes share one Supabase database:

1. **Next.js app** — authentication, the user dashboard (meters, analytics, reports,
   notifications, profile, settings), and the Super Admin console. All user-facing data
   access goes through a **user-scoped** Supabase client, so Row Level Security applies to
   every query. Admin-only reads use a separate `server-only` service-role client that is
   constructed **after** an `assertAdmin()` check and fails closed.

2. **Python monitoring worker** (`monitor/`) — runs on a schedule, authenticates with the
   **service-role key** (bypasses RLS, as the one trusted server context), polls the public
   DESCO `getBalance` API for each monitoring-enabled meter, writes readings/alerts/
   notifications, and sends email via SMTP. Pure decision logic (de-dup, hysteresis) lives
   in `monitor/alerting.py` and is I/O-free. See `monitor/README.md` for details.

```
Browser ──► Next.js (user-scoped client, RLS)      ┐
                                                    ├─► Supabase (Postgres + RLS)
GitHub Actions ──► Python worker (service role) ────┘        ▲
                        │                                     │
                        ├─► DESCO getBalance API (public)     │
                        └─► SMTP (optional) ──► meter owner ──┘
```

---

## Project structure

```
app/
  (public)/     Marketing pages (home, features, FAQ, about, contact, legal, …)
  (auth)/       Login, register, forgot/reset password
  (dashboard)/  User area: dashboard, meters, meters/[id], analytics, reports,
                notifications, profile, settings  (+ loading.tsx)
  (admin)/      Super Admin: overview, users, meters, analytics, reports,
                notifications, audit-logs, email, settings  (+ loading.tsx)
  actions/      Server Actions (typed ActionResult discriminated unions)
components/
  ui/           shadcn/ui primitives
  shared/       PageHeader, EmptyState, StatusBadge, PageSkeleton, toggles, logo
  dashboard/ meters/ reports/ notifications/ profile/ admin/ auth/   Feature components
lib/
  supabase/     client (browser), server (user-scoped), admin (service-role, server-only)
  services/     Data access (meters, reports, analytics, admin, …) — server-only
  i18n/         Typed EN/BN dictionaries + client/server translators
  validations/  Zod schemas
  constants.ts  Thresholds + status logic (mirrored by the worker)
supabase/
  migrations/   0001_init_schema.sql, 0002_rls_policies.sql
monitor/        Python monitoring worker (+ its own README)
.github/workflows/desco-monitor.yml   Scheduled runner
.env.example    Placeholders only (safe to commit)
```

---

## Setup

### 1. Install

```bash
npm install
```

Requires Node.js 18.18+ (Node 20+ recommended) and, for the worker, Python 3.12+.

### 2. Create a Supabase project

Create a project at [supabase.com](https://supabase.com). From **Project Settings → API**
you will need three values:

- Project URL
- `anon` public key (safe for the browser — constrained by RLS)
- `service_role` key (**secret** — server/worker only, never the browser)

### 3. Apply the database schema + RLS

Run the two migrations in order against your project (via the Supabase SQL editor or the
Supabase CLI):

```bash
supabase/migrations/0001_init_schema.sql   # tables, enums, triggers, seed settings
supabase/migrations/0002_rls_policies.sql  # enables RLS + per-user / admin policies
```

`0002` is what guarantees per-user isolation — do not skip it.

To grant yourself the Super Admin console, set your profile role to `super_admin` once your
account exists (run in the SQL editor, substituting your own email):

```sql
update public.profiles set role = 'super_admin' where email = 'you@example.com';
```

No demo or seed rows are ever created — the only non-user rows are 7 operational
configuration entries in `system_settings`. To audit this at any time, run
`supabase/verify_no_demo_data.sql` in the SQL editor (read-only; it also carries an
optional, clearly-marked destructive block to wipe user data back to a clean slate).

### 4. Configure environment variables

Copy the example file and fill in **your own** values. The example contains placeholders
only and is safe to commit; real `.env*` files are git-ignored.

```bash
cp .env.example .env.local
```

| Variable                        | Used by        | Secret? | Notes                                           |
| ------------------------------- | -------------- | :-----: | ----------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | app (browser)  |   No    | Project URL                                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | app (browser)  |   No    | Public anon key (constrained by RLS)            |
| `SUPABASE_URL`                  | worker         |   No    | Same URL, non-public name for the worker        |
| `SUPABASE_SERVICE_ROLE_KEY`     | app server + worker | **Yes** | Bypasses RLS — never prefix `NEXT_PUBLIC_` |
| `CLOUDINARY_CLOUD_NAME`         | app server     |   No    | Cloudinary cloud name (image storage)           |
| `CLOUDINARY_API_KEY`            | app server     | **Yes** | Cloudinary API key (server-only)                |
| `CLOUDINARY_API_SECRET`         | app server     | **Yes** | Cloudinary API secret — signs uploads, never exposed |
| `SMTP_HOST`                     | worker         |   No    | Default `smtp.gmail.com`                         |
| `SMTP_PORT`                     | worker         |   No    | Default `587` (STARTTLS)                         |
| `EMAIL_USER`                    | worker         | **Yes** | SMTP username / from address                    |
| `EMAIL_PASS`                    | worker         | **Yes** | SMTP password or app-specific password          |
| `EMAIL_FROM_NAME`               | worker         |   No    | Sender display name                             |
| `NEXT_PUBLIC_SITE_URL`          | app            |   No    | Public base URL for links                       |

> Anything prefixed `NEXT_PUBLIC_` is inlined into the browser bundle and is therefore
> **public**. Only non-secret values may use that prefix. If `EMAIL_USER` / `EMAIL_PASS`
> are unset, the worker still records readings, alerts, and in-app notifications — it
> simply does not send email. Likewise, if the `CLOUDINARY_*` variables are unset the
> profile page hides the "Upload photo" button and keeps the avatar-URL field — image
> upload degrades gracefully rather than erroring.

### 5. Run the web app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Run the monitoring worker

```bash
pip install -r monitor/requirements.txt
python -m monitor.main
```

The worker reads its configuration from the environment (export the variables above, or use
your shell / a process manager). See `monitor/README.md` for the full description of its
behavior and de-duplication policy.

### 7. Schedule it on GitHub Actions

`.github/workflows/desco-monitor.yml` runs the worker every 6 hours (and on demand). Add the
secrets under **Settings → Secrets and variables → Actions**:

- Required: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Optional (email): `SMTP_HOST`, `SMTP_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM_NAME`

The polling cadence is the cron expression in that workflow file; change it there.

---

## Security model

- **Row Level Security on every table.** A normal user can reach only rows they own;
  ownership of child rows (readings, alerts) is proven by joining up to `meters.user_id`.
  Policies live in `supabase/migrations/0002_rls_policies.sql`.
- **No trust in client-supplied identity.** Insert/update policies use
  `with check (user_id = auth.uid())`, so a forged owner id is rejected by the database
  even if the application layer were bypassed. Users cannot change their own role.
- **Service-role key is server-only.** The admin client is `server-only` and is built only
  after an admin check; the worker uses the key outside the browser entirely.
- **No secrets in source.** Every credential comes from environment variables. Secret
  fields are excluded from the worker's config `repr`, and logs never include passwords,
  tokens, DESCO/account numbers, emails, or customer balances.
- **Honest side effects.** Email is reported `sent` only after SMTP confirms; a failed
  DESCO read is recorded as `failed` and never mistaken for a real zero balance.
- **TLS.** Verification stays on for Supabase. It is disabled **only** for the public DESCO
  host, scoped to that one client, matching the original working script.

See `.env.example` and the inline comments in the SQL and Python for specifics.

---

## Scripts

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Start the dev server                     |
| `npm run build`     | Production build                         |
| `npm run start`     | Serve the production build               |
| `npm run lint`      | ESLint                                   |
| `npm run typecheck` | TypeScript (`tsc --noEmit`)              |

---

## License

MIT — see `package.json`. DESCO is a trademark of the Dhaka Electric Supply Company; this
project is an independent monitor and is not affiliated with or endorsed by DESCO.
