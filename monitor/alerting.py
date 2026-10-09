"""
Pure alert de-duplication / decision logic.

This is the heart of "don't email the same thing every scheduled run". It is
deliberately free of I/O so it can be reasoned about and unit-tested in
isolation: give it the fresh status, the thresholds, and the meter's most recent
alert, and it returns exactly one decision.

POLICY (mirrors lib/constants.ts and the project spec)
------------------------------------------------------
Given the meter's new status, decide whether to raise a new alert:

  (a) STATE CHANGE — the alert-worthy state changed (healthy->low, low->critical,
      critical->low, healthy->critical, or recovered->low/critical). A state
      change notifies immediately, bypassing the cooldown, so genuine escalation
      is never suppressed.
  (b) SAME STATE — re-notify only if the last alert for this meter is older than
      ALERT_COOLDOWN_HOURS (re-notify on cooldown expiry).
  (c) RECOVERY — if the meter was previously low/critical and the balance has
      climbed above ``threshold * (1 + RECOVERY_BUFFER)`` (hysteresis, anti-flap),
      emit exactly ONE recovery alert.
  otherwise -> "none" (send nothing; create no noise).

The "previously-notified state" is read from the single most-recent alert row of
ANY type. Because each alert-worthy state maps 1:1 to an alert type
(low->low_balance, critical->critical_balance, recovered->recovery), the most
recent alert is, when the state is unchanged, necessarily of the current type —
so a single row is enough to drive both the state-change and cooldown checks.
A previously-recorded alert counts regardless of its delivery status (sent /
failed / skipped): it still represents a state we recognised and acted on, which
is what dedup cares about. In practice this means a failed email is retried at
the cooldown cadence, not on every run.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Mapping, Optional

from .config import ALERT_COOLDOWN_HOURS, RECOVERY_BUFFER

# Decisions returned by :func:`decide_alert`. The non-"none" values are exactly
# the DB ``alert_type`` enum, so callers can use them directly.
DECISION_NONE = "none"
DECISION_LOW = "low_balance"
DECISION_CRITICAL = "critical_balance"
DECISION_RECOVERY = "recovery"

# Maps a recorded alert type back to the balance state it represented.
_TYPE_TO_STATE = {
    "low_balance": "low",
    "critical_balance": "critical",
    "recovery": "healthy",
}


@dataclass(frozen=True)
class LastAlert:
    """Normalised view of a meter's most recent alert row (dedup input)."""

    type: str  # low_balance | critical_balance | recovery
    created_at: datetime  # timezone-aware

    @classmethod
    def from_row(cls, row: Optional[Mapping[str, Any]]) -> Optional["LastAlert"]:
        """Build from a PostgREST alerts row, or None if unavailable/unusable."""
        if not row:
            return None
        alert_type = row.get("type")
        created_at = _parse_dt(row.get("created_at"))
        if not alert_type or created_at is None:
            return None
        return cls(type=alert_type, created_at=created_at)


def _parse_dt(raw: Any) -> Optional[datetime]:
    """Parse a PostgREST timestamptz string into an aware datetime."""
    if isinstance(raw, datetime):
        return raw if raw.tzinfo else raw.replace(tzinfo=timezone.utc)
    if isinstance(raw, str) and raw.strip():
        try:
            parsed = datetime.fromisoformat(raw.strip().replace("Z", "+00:00"))
        except ValueError:
            return None
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    return None


def decide_alert(
    new_status: str,
    new_balance: Optional[float],
    threshold: float,
    critical_threshold: float,
    last_alert: Optional[LastAlert],
    now: datetime,
) -> str:
    """Decide whether to raise an alert, and which kind.

    Returns one of: "none", "low_balance", "critical_balance", "recovery".

    Args:
        new_status: derived status of the fresh reading (healthy/low/critical/error).
        new_balance: fresh balance (used for recovery hysteresis).
        threshold: the meter's low threshold.
        critical_threshold: the meter's critical threshold (unused directly here;
            accepted for a stable, spec-matching signature and future rules).
        last_alert: the meter's most recent alert, or None if it has never alerted.
        now: current time (timezone-aware) for the cooldown comparison.
    """
    # Never raise a balance alert off a failed/unknown read. A failed DESCO check
    # is recorded as a failed reading elsewhere; it must not masquerade as low/0.
    if new_status == "error":
        return DECISION_NONE

    last_state = _TYPE_TO_STATE.get(last_alert.type) if last_alert else None

    if new_status in ("low", "critical"):
        desired = DECISION_CRITICAL if new_status == "critical" else DECISION_LOW

        # (a) State change (includes first-ever alert and severity changes such as
        #     low->critical or critical->low): notify now, bypassing the cooldown.
        if last_state != new_status:
            return desired

        # (b) Same state: re-notify only once the cooldown window has elapsed.
        assert last_alert is not None  # implied: same state => a prior alert exists
        if now - last_alert.created_at >= timedelta(hours=ALERT_COOLDOWN_HOURS):
            return desired
        return DECISION_NONE

    # new_status == "healthy"
    # (c) Recovery: only when we previously alerted low/critical AND the balance
    #     has cleared the threshold by the hysteresis buffer. Requiring the prior
    #     low/critical alert means we never send an unsolicited "recovered" email
    #     to a meter that was already healthy, and never send it twice.
    if last_state in ("low", "critical"):
        if new_balance is not None and float(new_balance) > threshold * (1.0 + RECOVERY_BUFFER):
            return DECISION_RECOVERY

    return DECISION_NONE
