# DESCO Smart — Monitoring Worker

A small, dependency-light Python worker that keeps the DESCO Smart database in
sync with the live DESCO prepaid balance for every actively-monitored meter, and
emails owners when a balance crosses a threshold (or recovers). It is designed to
run on a schedule from GitHub Actions, but runs identically from any shell.

The worker mirrors the business rules in the Next.js app's `lib/constants.ts`
(thresholds, cooldown, recovery hysteresis) so the backend and the UI never
disagree about what "low", "critical", or "recovered" means.

---

## How it works

One job, all active meters, batched. On each run the worker:

1. Fetches **all** meters with `monitoring_enabled = true` in a single query.
2. For each meter, calls the public DESCO `getBalance` API (30s timeout), pausing
   briefly between meters to be polite to the upstream service.
3. **On success**: appends a `balance_readings` row (`status='success'`), updates
   the meter snapshot (`current_balance`, `status`, `last_checked_at`,
   `current_month_consumption`, `reading_time`, clears `last_error`), then applies
   the alert dedup policy and emails the owner only if warranted.
4. **On DESCO failure**: appends a `balance_readings` row (`status='failed'`) and
   sets the meter to `error` with `last_error`. It does **not** change
   `current_balance` and does **not** send a balance alert — a failed check is
   never allowed to masquerade as a real `0`/low balance.
5. Wraps every meter in try/except so one bad meter never aborts the batch.
6. Prints an aggregate run summary (counts only — no meter numbers, emails, or
   individual balances).
7. Exits `0` even if some meters failed (a transient DESCO hiccup should not turn
   the workflow red). It exits non-zero only if the worker itself cannot run
   (missing Supabase config, or meters could not be fetched).

### Module layout

| File | Responsibility |
| --- | --- |
| `config.py` | Reads env vars; exposes constants mirroring `lib/constants.ts`; `derive_status`. |
| `desco_client.py` | DESCO `getBalance` client (`verify=False`, 30s). Returns a result dict. |
| `supabase_client.py` | Thin PostgREST wrapper using the service-role key. |
| `alerting.py` | **Pure** dedup/decision logic (state-change / cooldown / recovery). |
| `notifier.py` | stdlib SMTP email (STARTTLS). Low/critical + recovery templates. |
| `main.py` | Orchestrator implementing the batched flow above. |

---

## The alert dedup policy (why you don't get the same email every run)

The point of the worker is to alert on *changes*, not to re-send the same email
on every scheduled run. For each meter it looks at the single most-recent alert
row and decides:

- **State change** — the alert-worthy state changed (`healthy→low`, `low→critical`,
  `critical→low`, `healthy→critical`, or a recovered meter dropping again). This
  notifies **immediately**, bypassing the cooldown, so genuine escalation is never
  suppressed.
- **Same state** — re-notify only if the last alert is older than
  `ALERT_COOLDOWN_HOURS` (12h). Otherwise nothing is sent.
- **Recovery** — if the meter was previously `low`/`critical` and the balance has
  climbed above `threshold * (1 + RECOVERY_BUFFER)` (5% hysteresis to prevent
  flapping at the boundary), send exactly **one** recovery email.
- Otherwise: send nothing.

Notes:

- The in-app notification (the dashboard inbox) is created **whenever** an alert
  fires. Only the **email** is gated on preferences: the per-meter
  `email_alert_enabled` flag, the owner's `notification_preferences.email_alerts`
  master switch, and the matching per-type switch (`low_balance` /
  `critical_balance` / `recovery_alerts`). When email is gated off, the alert row
  is recorded with `status='skipped'`.
- An alert row is inserted as `pending`, then finalised to `sent` (SMTP confirmed),
  `failed` (SMTP error, with `error_message`), or `skipped`. We never mark an email
  `sent` before it actually is.
- A previously-recorded alert counts for dedup regardless of delivery status, so a
  failed email is retried at the cooldown cadence rather than on every run.

---

## Required environment variables

Set these as environment variables locally, or as **GitHub Actions repository
secrets** for the scheduled workflow. Names only below — never commit real values.
See the repository-root `.env.example` for the full, annotated list.

**Required (worker will refuse to start without these):**

- `SUPABASE_URL` — your project URL, e.g. `https://xxxx.supabase.co`.
- `SUPABASE_SERVICE_ROLE_KEY` — the **service-role** key. It bypasses RLS; the
  worker is the one trusted server context. Never expose it to the browser.

**Optional (email; if unset, alerts are recorded but not emailed):**

- `SMTP_HOST` — SMTP server (default `smtp.gmail.com`).
- `SMTP_PORT` — SMTP port (default `587`, STARTTLS).
- `EMAIL_USER` — SMTP username / from address.
- `EMAIL_PASS` — SMTP password or app-specific password.
- `EMAIL_FROM_NAME` — sender display name (default `DESCO Smart`).

The worker reads every secret from the environment at runtime. Nothing sensitive
is hardcoded, and secret values are kept out of logs and tracebacks.

---

## Running locally

From the **project root** (`desco/`), with Python 3.12:

```bash
# 1. Install the single dependency (a virtualenv is recommended).
python -m pip install -r monitor/requirements.txt

# 2. Provide the environment. For local dev, export the vars in your shell or use
#    a tool such as `dotenv`/direnv. NEVER commit a populated .env file.
export SUPABASE_URL="https://xxxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="..."      # service-role key
# (optional email)
export EMAIL_USER="alerts@example.com"
export EMAIL_PASS="app-password"

# 3. Run the worker as a module.
python -m monitor.main
```

A run prints a single summary line, for example:

```
[monitor] run complete: meters=12 succeeded=11 failed=1 errored=0 alerts_emailed=2 alerts_skipped=1 alerts_failed=0
```

---

## TLS note (`verify=False` for DESCO only)

The DESCO client uses `requests(..., verify=False)` and suppresses urllib3's
`InsecureRequestWarning`. This is **preserved on purpose** from the original
working `desco_check.py`: Python's certifi CA bundle rejects DESCO's certificate
chain, so verification would make every check fail. The bypass is scoped to the
DESCO host only. **TLS verification stays ON for all Supabase calls** — we never
weaken TLS for our own backend.

---

## Scheduling

The scheduled run is defined in `.github/workflows/desco-monitor.yml` — every 6
hours (`cron: '0 */6 * * *'`), plus a manual `workflow_dispatch` trigger.
