"""
Runtime configuration and business constants for the DESCO Smart worker.

This module mirrors the thresholds and status logic defined in the Next.js app's
`lib/constants.ts`. When a value changes there, change it here too — the two are
kept deliberately in lock-step so the scheduled Python worker and the web UI
never disagree about what "low", "critical", or "recovered" means. (The DB
`system_settings` table documents the same defaults for human operators.)

SECURITY
--------
No secret is ever hardcoded. Every credential (the Supabase service-role key, the
SMTP password, ...) is read from the environment at runtime, and the secret
fields are excluded from this object's ``repr`` so an accidental ``print(config)``
or an exception traceback can never leak them.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Optional

# ---------------------------------------------------------------------------
# Business rules — mirror of lib/constants.ts
# ---------------------------------------------------------------------------

#: Fallback thresholds applied when a meter row does not specify its own.
DEFAULT_LOW_THRESHOLD: float = 300.0
DEFAULT_CRITICAL_THRESHOLD: float = 100.0

#: While a meter stays in the same alert state we re-notify at most once per this
#: many hours (24 hours cooldown). A *state change* bypasses the cooldown (see monitor/alerting.py).
ALERT_COOLDOWN_HOURS: int = 24

#: Hysteresis buffer for recovery, as a fraction of the threshold. A meter must
#: climb above ``threshold * (1 + RECOVERY_BUFFER)`` before we call it recovered,
#: which stops "recovered/low" flapping when the balance hovers at the boundary.
RECOVERY_BUFFER: float = 0.05

#: Bangladesh has a single fixed offset (UTC+6, no DST).
APP_TIMEZONE: str = "Asia/Dhaka"

# ---------------------------------------------------------------------------
# DESCO API
# ---------------------------------------------------------------------------

#: Base URL of the public DESCO prepaid customer API (no auth required).
DESCO_API_BASE: str = "https://prepaid.desco.org.bd/api/tkdes/customer"

#: 30s matches the timeout used by the original working ``desco_check.py``.
DESCO_REQUEST_TIMEOUT_SECONDS: int = 30

# ---------------------------------------------------------------------------
# Supabase (PostgREST) — TLS is ALWAYS verified for these calls
# ---------------------------------------------------------------------------

SUPABASE_REQUEST_TIMEOUT_SECONDS: int = 30

# ---------------------------------------------------------------------------
# Worker behaviour
# ---------------------------------------------------------------------------

#: Small courtesy pause between meters so we never hammer the public DESCO API.
POLITE_DELAY_SECONDS: float = 1.0

# ---------------------------------------------------------------------------
# SMTP defaults (each overridable via env)
# ---------------------------------------------------------------------------

DEFAULT_SMTP_HOST: str = "smtp.gmail.com"
DEFAULT_SMTP_PORT: int = 587
DEFAULT_EMAIL_FROM_NAME: str = "DESCO Smart"


class MissingConfigError(RuntimeError):
    """Raised when a required environment variable is absent.

    The worker treats this as fatal (it genuinely cannot run), as opposed to a
    per-meter DESCO hiccup which is tolerated.
    """


@dataclass(frozen=True)
class Config:
    """Immutable snapshot of the environment the worker runs with.

    Secret fields set ``repr=False`` so they never surface in logs or tracebacks.
    """

    supabase_url: str
    supabase_service_role_key: str = field(repr=False)
    smtp_host: str
    smtp_port: int
    email_user: Optional[str] = field(default=None, repr=False)
    email_pass: Optional[str] = field(default=None, repr=False)
    email_from_name: str = DEFAULT_EMAIL_FROM_NAME

    @property
    def email_configured(self) -> bool:
        """True only when both SMTP username and password are present.

        When False the worker still records readings, alerts, and in-app
        notifications — it simply does not attempt to send email.
        """
        return bool(self.email_user and self.email_pass)

    def with_smtp_overrides(self, db_settings: dict) -> "Config":
        """Return a copy of Config augmented with database system_settings."""
        host = db_settings.get("smtp_host") or self.smtp_host
        port_raw = db_settings.get("smtp_port")
        port = self.smtp_port
        if port_raw:
            try:
                port = int(str(port_raw).strip())
            except ValueError:
                pass
        user = db_settings.get("smtp_user") or self.email_user
        password = db_settings.get("smtp_pass") or self.email_pass
        from_name = db_settings.get("smtp_from_name") or self.email_from_name
        return Config(
            supabase_url=self.supabase_url,
            supabase_service_role_key=self.supabase_service_role_key,
            smtp_host=host,
            smtp_port=port,
            email_user=user,
            email_pass=password,
            email_from_name=from_name,
        )


def _get_int_env(name: str, default: int) -> int:
    """Read an int env var, falling back loudly (not silently) on garbage."""
    raw = os.environ.get(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return int(raw.strip())
    except ValueError:
        print(f"[monitor] warning: {name} is not an integer; using {default}", flush=True)
        return default


def load_config() -> Config:
    """Build a :class:`Config` from the environment.

    Raises :class:`MissingConfigError` if either of the two hard requirements
    (``SUPABASE_URL``, ``SUPABASE_SERVICE_ROLE_KEY``) is missing. SMTP settings
    are optional; without them email delivery is skipped rather than failing.
    """
    supabase_url = os.environ.get("SUPABASE_URL", "").strip()
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()

    missing = [
        name
        for name, value in (
            ("SUPABASE_URL", supabase_url),
            ("SUPABASE_SERVICE_ROLE_KEY", service_key),
        )
        if not value
    ]
    if missing:
        raise MissingConfigError(
            "Missing required environment variable(s): "
            + ", ".join(missing)
            + ". Set them as environment variables / GitHub Actions secrets."
        )

    return Config(
        # Trailing slash removed so REST paths join cleanly.
        supabase_url=supabase_url.rstrip("/"),
        supabase_service_role_key=service_key,
        smtp_host=os.environ.get("SMTP_HOST", "").strip() or DEFAULT_SMTP_HOST,
        smtp_port=_get_int_env("SMTP_PORT", DEFAULT_SMTP_PORT),
        email_user=(os.environ.get("EMAIL_USER", "").strip() or None),
        # A password is intentionally NOT stripped — trailing chars could matter.
        email_pass=(os.environ.get("EMAIL_PASS") or None),
        email_from_name=os.environ.get("EMAIL_FROM_NAME", "").strip()
        or DEFAULT_EMAIL_FROM_NAME,
    )


def derive_status(
    balance: Optional[float],
    threshold: float,
    critical_threshold: float,
) -> str:
    """Derive a meter's balance status. Mirror of ``deriveStatus`` in constants.ts.

    Inclusive comparisons, matching the original Python ``balance <= THRESHOLD``:

        balance is None / NaN            -> "error"
        balance <= critical_threshold    -> "critical"
        balance <= threshold             -> "low"
        otherwise                        -> "healthy"
    """
    if balance is None:
        return "error"
    try:
        value = float(balance)
    except (TypeError, ValueError):
        return "error"
    if value != value:  # NaN
        return "error"
    if value <= critical_threshold:
        return "critical"
    if value <= threshold:
        return "low"
    return "healthy"
