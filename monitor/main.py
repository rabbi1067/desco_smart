"""
Orchestrator for the DESCO Smart monitoring worker.

ONE job, ALL active meters, batched. On each run the worker:

  1. Fetches every meter with ``monitoring_enabled = true`` in a single query.
  2. For each meter, calls the DESCO ``getBalance`` API (verify=False, 30s), with
     a short polite pause between meters.
  3. On success: appends a ``balance_readings`` row (status='success'), updates the
     meter snapshot, then runs the dedup/alert decision and emails if warranted.
  4. On DESCO failure: appends a ``balance_readings`` row (status='failed') and
     sets the meter to ``error`` with ``last_error`` — WITHOUT touching
     ``current_balance`` and WITHOUT sending a balance alert (a failed read must
     never look like a real 0/low balance).
  5. Wraps each meter so one bad meter never aborts the batch.
  6. Prints an aggregate summary — counts only, no identifiable customer data.
  7. Exits 0 even if some meters failed (transient DESCO hiccups must not turn the
     scheduled workflow red); exits non-zero only if the worker itself cannot run
     (missing Supabase config, meters unfetchable).

LOGGING RULES
-------------
Meter UUIDs are logged; DESCO account/meter numbers, emails, secrets, and
specific customer balances are NOT. Aggregate counts are fine.
"""

from __future__ import annotations

import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

import requests

from .alerting import (
    DECISION_CRITICAL,
    DECISION_NONE,
    DECISION_RECOVERY,
    LastAlert,
    decide_alert,
)
from .config import (
    DEFAULT_CRITICAL_THRESHOLD,
    DEFAULT_LOW_THRESHOLD,
    POLITE_DELAY_SECONDS,
    Config,
    MissingConfigError,
    derive_status,
    load_config,
)
from .desco_client import get_balance
from .notifier import send_low_balance_email, send_recovery_email
from .supabase_client import SupabaseClient, SupabaseError


@dataclass
class RunStats:
    """Aggregate, non-identifying counters printed at the end of a run."""

    total: int = 0
    succeeded: int = 0  # DESCO read ok, success reading recorded
    failed: int = 0  # DESCO read failed, failed reading recorded
    errored: int = 0  # unexpected worker-side error for a meter
    alerts_emailed: int = 0
    alerts_skipped: int = 0
    alerts_failed: int = 0


def _log(message: str) -> None:
    """Print a namespaced, flushed log line. Callers must pass no PII/secrets."""
    print(f"[monitor] {message}", flush=True)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _to_float(value: Any) -> Optional[float]:
    """Coerce a PostgREST numeric (number or numeric-string) to float, else None."""
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value) if value == value else None
    if isinstance(value, str) and value.strip():
        try:
            parsed = float(value.strip())
        except ValueError:
            return None
        return parsed if parsed == parsed else None
    return None


def _thresholds(meter: Dict[str, Any]) -> Tuple[float, float]:
    """Resolve (low, critical) thresholds, falling back to the app defaults."""
    low = _to_float(meter.get("threshold"))
    critical = _to_float(meter.get("critical_threshold"))
    return (
        low if low is not None else DEFAULT_LOW_THRESHOLD,
        critical if critical is not None else DEFAULT_CRITICAL_THRESHOLD,
    )


def _format_taka(amount: Optional[float]) -> str:
    if amount is None:
        return "৳—"
    return f"৳{amount:,.2f}"


def main() -> int:
    """Entry point. Returns a process exit code (0 unless the worker can't run)."""
    _log("starting DESCO balance monitor")

    try:
        config = load_config()
    except MissingConfigError as exc:
        # The worker itself cannot run — fail the workflow so it is noticed.
        _log(f"configuration error: {exc}")
        return 1

    if not config.email_configured:
        # Not fatal: readings and in-app notifications still happen; only email
        # delivery is skipped. Logged once, without any secret.
        _log("email not configured (EMAIL_USER/EMAIL_PASS unset); alerts will be recorded but not emailed")

    supabase = SupabaseClient(config)

    try:
        meters = supabase.get_active_meters()
    except SupabaseError as exc:
        # Without the meter list there is nothing to do — treat as fatal.
        _log(f"could not load meters from Supabase: {exc}")
        return 1

    stats = RunStats(total=len(meters))
    _log(f"loaded {len(meters)} meter(s) with monitoring enabled")

    # A shared session reuses the TCP/TLS connection across DESCO calls.
    desco_session = requests.Session()
    last_index = len(meters) - 1

    for index, meter in enumerate(meters):
        meter_id = meter.get("id", "<unknown>")
        try:
            _process_meter(config, supabase, desco_session, meter, stats)
        except SupabaseError as exc:
            stats.errored += 1
            _log(f"meter {meter_id}: Supabase error: {exc}")
        except Exception as exc:  # noqa: BLE001 - one bad meter must not abort the batch
            stats.errored += 1
            _log(f"meter {meter_id}: unexpected error: {exc.__class__.__name__}")

        # Be polite to the public DESCO API between meters (skip after the last).
        if index < last_index:
            time.sleep(POLITE_DELAY_SECONDS)

    _log(
        "run complete: "
        f"meters={stats.total} succeeded={stats.succeeded} failed={stats.failed} "
        f"errored={stats.errored} alerts_emailed={stats.alerts_emailed} "
        f"alerts_skipped={stats.alerts_skipped} alerts_failed={stats.alerts_failed}"
    )

    # Transient per-meter failures must NOT fail the scheduled workflow.
    return 0


def _process_meter(
    config: Config,
    supabase: SupabaseClient,
    desco_session: requests.Session,
    meter: Dict[str, Any],
    stats: RunStats,
) -> None:
    """Check one meter end-to-end: read, persist, then decide/deliver alerts."""
    meter_id = meter.get("id")
    account_no = str(meter.get("account_number") or "").strip()
    meter_no = str(meter.get("meter_number") or "").strip()
    threshold, critical = _thresholds(meter)
    now_iso = _now_iso()

    if not account_no or not meter_no:
        # A meter with no numbers can't be looked up; record a failure rather than
        # a fake 0. (Should not happen given DB constraints, but never assume.)
        _record_failure(supabase, meter, stats, now_iso, kind="misconfigured",
                        message="Meter is missing its account or meter number")
        _log(f"meter {meter_id}: skipped (misconfigured)")
        return

    result = get_balance(account_no, meter_no, session=desco_session)

    if not result.get("ok"):
        kind = result.get("kind", "upstream")
        message = result.get("error", "DESCO lookup failed")
        _record_failure(supabase, meter, stats, now_iso, kind=kind, message=message)
        _log(f"meter {meter_id}: DESCO read failed ({kind})")
        return

    data = result["data"]
    balance = data["balance"]  # guaranteed a real float by the DESCO client
    new_status = derive_status(balance, threshold, critical)

    # Persist the successful reading (this is what the app charts) ...
    supabase.insert_reading(
        meter_id=meter_id,
        balance=balance,
        status="success",
        source="scheduled",
        reading_time=data.get("readingTime"),
        current_month_consumption=data.get("currentMonthConsumption"),
    )
    # ... and update the meter's live snapshot.
    supabase.update_meter(
        meter_id,
        {
            "current_balance": balance,
            "status": new_status,
            "last_checked_at": now_iso,
            "last_error": None,
            "current_month_consumption": data.get("currentMonthConsumption"),
            "reading_time": data.get("readingTime"),
        },
    )
    stats.succeeded += 1
    # Status is a coarse category (not a balance), so it is safe to log.
    _log(f"meter {meter_id}: read ok, status={new_status}")

    # Alerting is best-effort: a delivery hiccup must not undo the recorded read.
    try:
        _handle_alert(config, supabase, meter, new_status, balance, threshold, critical, stats)
    except SupabaseError as exc:
        _log(f"meter {meter_id}: alert step failed: {exc}")
    except Exception as exc:  # noqa: BLE001
        _log(f"meter {meter_id}: alert step error: {exc.__class__.__name__}")


def _record_failure(
    supabase: SupabaseClient,
    meter: Dict[str, Any],
    stats: RunStats,
    now_iso: str,
    *,
    kind: str,
    message: str,
) -> None:
    """Record a DESCO failure without corrupting the meter's known balance.

    ``balance_readings.balance`` is NOT NULL, so we write the last known balance
    (or 0 if none) but mark the row ``failed`` with the error kind. The app only
    charts ``status='success'`` rows, so this balance is never plotted, and — crucially —
    a failed read is never mistaken for a real 0 that would fire a critical alert.
    The meter's ``current_balance`` is left untouched; only ``status``/``last_error``
    move to reflect the outage.
    """
    meter_id = meter.get("id")
    last_known = _to_float(meter.get("current_balance"))
    balance_for_row = last_known if last_known is not None else 0

    supabase.insert_reading(
        meter_id=meter_id,
        balance=balance_for_row,
        status="failed",
        source="scheduled",
        error_message=kind,
    )
    supabase.update_meter(
        meter_id,
        {"status": "error", "last_checked_at": now_iso, "last_error": message},
    )
    stats.failed += 1


def _handle_alert(
    config: Config,
    supabase: SupabaseClient,
    meter: Dict[str, Any],
    new_status: str,
    balance: float,
    threshold: float,
    critical: float,
    stats: RunStats,
) -> None:
    """Apply the dedup policy and, if warranted, record + deliver an alert."""
    meter_id = meter.get("id")
    user_id = meter.get("user_id")

    last_alert = LastAlert.from_row(supabase.get_last_alert(meter_id))
    decision = decide_alert(
        new_status,
        balance,
        threshold,
        critical,
        last_alert,
        datetime.now(timezone.utc),
    )
    if decision == DECISION_NONE:
        return

    # The threshold recorded on the alert is the one that was actually crossed.
    alert_threshold = critical if decision == DECISION_CRITICAL else threshold

    # Record intent first (status='pending'); we only mark it 'sent' after SMTP
    # confirms, and 'skipped'/'failed' otherwise — never a fabricated success.
    alert_id = supabase.insert_alert(
        meter_id=meter_id,
        user_id=user_id,
        type=decision,
        threshold=alert_threshold,
        balance=balance,
        status="pending",
    )

    # Always create the in-app notification (that is not an email; the email is
    # what we gate on preferences below).
    title, message = _notification_copy(decision, meter, balance)
    supabase.insert_notification(
        user_id=user_id,
        meter_id=meter_id,
        type=decision,
        title=title,
        message=message,
    )

    should_email, reason = _email_allowed(config, supabase, meter, user_id, decision)
    if not should_email:
        if alert_id:
            supabase.update_alert_sent(alert_id, status="skipped", error_message=reason)
        stats.alerts_skipped += 1
        _log(f"meter {meter_id}: alert {decision} recorded, email skipped ({reason})")
        return

    owner = supabase.get_owner(user_id)
    if not owner or not owner.get("email"):
        if alert_id:
            supabase.update_alert_sent(alert_id, status="skipped", error_message="owner email unavailable")
        stats.alerts_skipped += 1
        _log(f"meter {meter_id}: alert {decision} recorded, email skipped (no owner email)")
        return

    ok, error = _deliver_email(config, owner, meter, decision, balance, threshold, critical)
    if ok:
        if alert_id:
            supabase.update_alert_sent(alert_id, status="sent", sent_at=_now_iso())
        stats.alerts_emailed += 1
        _log(f"meter {meter_id}: alert {decision} emailed")
    else:
        if alert_id:
            supabase.update_alert_sent(alert_id, status="failed", error_message=error)
        stats.alerts_failed += 1
        # No PII/secret in this line; delivery detail lives in the DB row only.
        _log(f"meter {meter_id}: alert {decision} email failed")


def _email_allowed(
    config: Config,
    supabase: SupabaseClient,
    meter: Dict[str, Any],
    user_id: str,
    decision: str,
) -> Tuple[bool, str]:
    """Gate ONLY the email on per-meter and per-user preferences.

    Returns (allowed, reason). The in-app notification is created regardless; this
    decides solely whether an email is attempted.
    """
    if not config.email_configured:
        return False, "email not configured"
    if not bool(meter.get("email_alert_enabled", True)):
        return False, "meter email alerts disabled"

    prefs = supabase.get_notification_prefs(user_id)
    if prefs is not None:
        if not prefs.get("email_alerts", True):
            return False, "user email alerts disabled"
        per_type_key = {
            "low_balance": "low_balance",
            "critical_balance": "critical_balance",
            "recovery": "recovery_alerts",
        }[decision]
        if not prefs.get(per_type_key, True):
            return False, f"user {decision} alerts disabled"

    return True, ""


def _deliver_email(
    config: Config,
    owner: Dict[str, Any],
    meter: Dict[str, Any],
    decision: str,
    balance: float,
    threshold: float,
    critical: float,
) -> Tuple[bool, Optional[str]]:
    """Dispatch to the correct notifier function for the decision."""
    to_email = owner["email"]
    to_name = owner.get("full_name")
    meter_name = meter.get("name") or "Your meter"
    meter_number = meter.get("meter_number") or ""

    if decision == DECISION_RECOVERY:
        return send_recovery_email(
            config,
            to_email=to_email,
            to_name=to_name,
            meter_name=meter_name,
            meter_number=meter_number,
            balance=balance,
            threshold=threshold,
        )
    return send_low_balance_email(
        config,
        to_email=to_email,
        to_name=to_name,
        meter_name=meter_name,
        meter_number=meter_number,
        balance=balance,
        threshold=threshold,
        critical_threshold=critical,
        is_critical=(decision == DECISION_CRITICAL),
    )


def _notification_copy(
    decision: str,
    meter: Dict[str, Any],
    balance: float,
) -> Tuple[str, str]:
    """Build the in-app notification title/message for a decision."""
    name = meter.get("name") or "your meter"
    formatted = _format_taka(balance)
    if decision == DECISION_CRITICAL:
        return (
            "Critical balance",
            f"{name} balance is critically low at {formatted}. Recharge now to avoid disconnection.",
        )
    if decision == DECISION_RECOVERY:
        return (
            "Balance recovered",
            f"{name} balance has recovered to {formatted}.",
        )
    return (
        "Low balance",
        f"{name} balance is low at {formatted}. Consider recharging soon.",
    )


if __name__ == "__main__":
    sys.exit(main())
