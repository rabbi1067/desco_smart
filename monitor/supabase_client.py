"""
Thin PostgREST wrapper for the DESCO Smart worker.

The worker is the ONE trusted server context: it authenticates to Supabase with
the SERVICE-ROLE key, which bypasses Row Level Security. That key is read from the
environment (never hardcoded) and lives only in memory. We talk to PostgREST with
plain ``requests`` rather than adding a ``supabase-py`` dependency — a handful of
REST calls do not warrant it.

TLS verification is left ON for every call here (the default). We only ever
disable it for the DESCO host, in ``monitor/desco_client.py``.

All methods raise :class:`SupabaseError` on transport or HTTP failure. Callers in
``monitor/main.py`` decide what is fatal (e.g. the initial meter fetch) versus
per-meter and recoverable.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import requests

from .config import Config, SUPABASE_REQUEST_TIMEOUT_SECONDS


class SupabaseError(RuntimeError):
    """Raised on any Supabase/PostgREST transport or HTTP error.

    Messages are sanitised: they never include request headers (which carry the
    service-role key). PostgREST response bodies do not echo credentials.
    """


class SupabaseClient:
    """Minimal PostgREST client scoped to the tables the worker touches."""

    def __init__(self, config: Config) -> None:
        self._rest = f"{config.supabase_url}/rest/v1"
        self._timeout = SUPABASE_REQUEST_TIMEOUT_SECONDS
        self._session = requests.Session()
        # These headers ride on every request. The key is the service-role key.
        self._session.headers.update(
            {
                "apikey": config.supabase_service_role_key,
                "Authorization": f"Bearer {config.supabase_service_role_key}",
                "Content-Type": "application/json",
            }
        )

    # -- low-level ---------------------------------------------------------

    def _request(
        self,
        method: str,
        table: str,
        *,
        params: Optional[Dict[str, str]] = None,
        json: Any = None,
        prefer: Optional[str] = None,
    ) -> requests.Response:
        url = f"{self._rest}/{table}"
        headers = {"Prefer": prefer} if prefer else None
        try:
            response = self._session.request(
                method,
                url,
                params=params,
                json=json,
                headers=headers,
                timeout=self._timeout,
            )
        except requests.RequestException as exc:
            # Only the exception class is surfaced — never the request repr, which
            # could otherwise widen what ends up in a log line.
            raise SupabaseError(
                f"{method} {table} transport error: {exc.__class__.__name__}"
            ) from None

        if response.status_code >= 400:
            snippet = (response.text or "").strip()[:300]
            raise SupabaseError(f"{method} {table} -> HTTP {response.status_code}: {snippet}")
        return response

    @staticmethod
    def _rows(response: requests.Response) -> List[Dict[str, Any]]:
        try:
            body = response.json()
        except ValueError:
            return []
        return body if isinstance(body, list) else []

    # -- reads -------------------------------------------------------------

    def get_active_meters(self) -> List[Dict[str, Any]]:
        """All meters with monitoring enabled, fetched in ONE query."""
        response = self._request(
            "GET",
            "meters",
            params={"select": "*", "monitoring_enabled": "eq.true"},
        )
        return self._rows(response)

    def get_last_alert(self, meter_id: str) -> Optional[Dict[str, Any]]:
        """The meter's most recent alert of any type (drives dedup), or None."""
        response = self._request(
            "GET",
            "alerts",
            params={
                "select": "*",
                "meter_id": f"eq.{meter_id}",
                "order": "created_at.desc",
                "limit": "1",
            },
        )
        rows = self._rows(response)
        return rows[0] if rows else None

    def get_owner(self, user_id: str) -> Optional[Dict[str, Any]]:
        """The meter owner's email + display name, for the alert email."""
        response = self._request(
            "GET",
            "profiles",
            params={"select": "email,full_name", "id": f"eq.{user_id}", "limit": "1"},
        )
        rows = self._rows(response)
        if not rows:
            return None
        return {"email": rows[0].get("email"), "full_name": rows[0].get("full_name")}

    def get_notification_prefs(self, user_id: str) -> Optional[Dict[str, Any]]:
        """The owner's notification preferences row, or None if absent."""
        response = self._request(
            "GET",
            "notification_preferences",
            params={"select": "*", "user_id": f"eq.{user_id}", "limit": "1"},
        )
        rows = self._rows(response)
        return rows[0] if rows else None

    # -- writes ------------------------------------------------------------

    def insert_reading(
        self,
        *,
        meter_id: str,
        balance: float,
        status: str,
        source: str = "scheduled",
        reading_time: Optional[str] = None,
        current_month_consumption: Optional[float] = None,
        error_message: Optional[str] = None,
    ) -> None:
        """Append a balance_readings row (append-only time series).

        ``balance`` is NOT NULL in the schema. For a FAILED reading the caller
        passes the last known balance (or 0) with ``status='failed'`` and an
        ``error_message`` — the app charts only ``status='success'`` rows, so a
        failed row's balance is never plotted and never treated as a real 0.
        """
        payload = {
            "meter_id": meter_id,
            "balance": balance,
            "status": status,
            "source": source,
            "reading_time": reading_time,
            "current_month_consumption": current_month_consumption,
            "error_message": error_message,
        }
        self._request("POST", "balance_readings", json=payload, prefer="return=minimal")

    def update_meter(self, meter_id: str, fields: Dict[str, Any]) -> None:
        """Patch the mutable snapshot columns on a meter row."""
        self._request(
            "PATCH",
            "meters",
            params={"id": f"eq.{meter_id}"},
            json=fields,
            prefer="return=minimal",
        )

    def insert_alert(
        self,
        *,
        meter_id: str,
        user_id: str,
        type: str,
        threshold: float,
        balance: float,
        status: str = "pending",
    ) -> Optional[str]:
        """Insert an alert row and return its id.

        Inserted as ``pending`` first (durable record of intent) and only moved to
        ``sent`` once SMTP confirms — we never mark an email sent before it is.
        """
        payload = {
            "meter_id": meter_id,
            "user_id": user_id,
            "type": type,
            "threshold": threshold,
            "balance": balance,
            "status": status,
        }
        response = self._request(
            "POST", "alerts", json=payload, prefer="return=representation"
        )
        rows = self._rows(response)
        return rows[0].get("id") if rows else None

    def update_alert_sent(
        self,
        alert_id: str,
        *,
        status: str,
        sent_at: Optional[str] = None,
        error_message: Optional[str] = None,
    ) -> None:
        """Finalise an alert's delivery outcome (sent / failed / skipped)."""
        fields: Dict[str, Any] = {"status": status}
        if sent_at is not None:
            fields["sent_at"] = sent_at
        if error_message is not None:
            fields["error_message"] = error_message
        self._request(
            "PATCH",
            "alerts",
            params={"id": f"eq.{alert_id}"},
            json=fields,
            prefer="return=minimal",
        )

    def insert_notification(
        self,
        *,
        user_id: str,
        meter_id: Optional[str],
        type: str,
        title: str,
        message: str,
    ) -> None:
        """Create an in-app notification (this is NOT an email)."""
        payload = {
            "user_id": user_id,
            "meter_id": meter_id,
            "type": type,
            "title": title,
            "message": message,
        }
        self._request("POST", "notifications", json=payload, prefer="return=minimal")

    def get_smtp_settings(self) -> Dict[str, Any]:
        """Fetch system_settings for SMTP credentials configured in the UI."""
        try:
            response = self._request("GET", "system_settings", params={"select": "key,value"})
            rows = self._rows(response)
            return {r.get("key"): r.get("value") for r in rows if r.get("key")}
        except Exception:
            return {}
