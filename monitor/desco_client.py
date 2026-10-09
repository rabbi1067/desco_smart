"""
DESCO prepaid customer API client — balance lookup only.

ORIGIN
------
The endpoint, query parameters, and TLS handling here are carried over verbatim
from the project's original working script, ``desco_check.py``:

    GET https://prepaid.desco.org.bd/api/tkdes/customer/getBalance
        ?accountNo=<account>&meterNo=<meter>

That script talked to a public, unauthenticated endpoint — knowing the account
and meter numbers is the only "credential" — so this client holds no secrets and
sends none.

TLS — verify=False (PRESERVED ON PURPOSE)
-----------------------------------------
``desco_check.py`` used ``requests`` with ``verify=False`` and silenced urllib3's
``InsecureRequestWarning``, because Python's certifi CA bundle rejects DESCO's
certificate chain and otherwise makes every check fail. That behaviour is kept
HERE, scoped to the DESCO host only. Our own backend client
(``monitor/supabase_client.py``) keeps TLS verification ON — we never weaken TLS
for Supabase, only for this one stubborn public host.

ERROR MODEL
-----------
Every lookup returns a result dict and never raises for a lookup problem:

    {"ok": True,  "data": {...}}
    {"ok": False, "error": "<message>", "kind": "<kind>"}

``kind`` is one of: not_found | network | timeout | upstream | malformed.

A missing or unparseable balance is a FAILED lookup ("not_found"), NEVER a 0 —
fabricating a 0 would trip a false "critical balance" alert.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Dict, Optional

import requests
import urllib3
from urllib3.exceptions import InsecureRequestWarning

from .config import DESCO_API_BASE, DESCO_REQUEST_TIMEOUT_SECONDS

# Silence ONLY the "insecure request" warning that verify=False emits. This is
# intentional and limited to the DESCO integration (see the module docstring);
# it does not affect TLS verification for any other host.
urllib3.disable_warnings(InsecureRequestWarning)

_ERROR_MESSAGES: Dict[str, str] = {
    "not_found": "DESCO could not find this meter or returned no balance.",
    "network": "Could not reach the DESCO service.",
    "timeout": "The DESCO service did not respond in time.",
    "upstream": "The DESCO service returned an unexpected response.",
    "malformed": "The DESCO service returned data in an unrecognised format.",
}


def _fail(kind: str, detail: Optional[str] = None) -> Dict[str, Any]:
    base = _ERROR_MESSAGES.get(kind, _ERROR_MESSAGES["upstream"])
    return {
        "ok": False,
        "kind": kind,
        "error": f"{base} ({detail})" if detail else base,
    }


def _num(value: Any) -> Optional[float]:
    """Coerce DESCO's loosely-typed numerics.

    Returns None (never 0) for absent/unparseable values — 0 is a meaningful
    balance and must never be manufactured from missing data.
    """
    if isinstance(value, bool):  # guard: bool is a subclass of int
        return None
    if isinstance(value, (int, float)):
        return float(value) if value == value else None  # reject NaN
    if isinstance(value, str) and value.strip():
        try:
            parsed = float(value.strip())
        except ValueError:
            return None
        return parsed if parsed == parsed else None
    return None


def _str(value: Any) -> Optional[str]:
    return value.strip() if isinstance(value, str) and value.strip() else None


def _parse_reading_time(raw: Any) -> Optional[str]:
    """Normalise DESCO's ``"YYYY-MM-DD HH:mm:ss"`` reading time to ISO-8601.

    DESCO reports Dhaka local time (UTC+6, no DST) with no zone. We append
    ``+06:00`` explicitly instead of letting the runtime guess, otherwise a
    UTC-based CI runner would shift every timestamp by six hours. Returns None on
    anything unparseable rather than guessing.
    """
    value = _str(raw)
    if not value:
        return None
    normalised = value if "T" in value else value.replace(" ", "T", 1)
    if not re.search(r"(Z|[+-]\d{2}:?\d{2})$", normalised):
        normalised = f"{normalised}+06:00"
    try:
        return datetime.fromisoformat(normalised.replace("Z", "+00:00")).isoformat()
    except ValueError:
        return None


def get_balance(
    account_no: str,
    meter_no: str,
    session: Optional[requests.Session] = None,
) -> Dict[str, Any]:
    """Fetch the current prepaid balance for one meter.

    This is the direct successor to the original script's single API call. On
    success ``data`` carries: accountNo, meterNo, balance (float),
    currentMonthConsumption (float|None), readingTime (ISO str|None).

    NOTE: account/meter numbers are NEVER logged or embedded in error messages.
    """
    url = f"{DESCO_API_BASE}/getBalance"
    params = {"accountNo": account_no, "meterNo": meter_no}
    http = session or requests

    try:
        response = http.get(
            url,
            params=params,
            timeout=DESCO_REQUEST_TIMEOUT_SECONDS,
            # PRESERVED from desco_check.py — DESCO's cert chain fails certifi.
            # Scoped to this host only; see the module docstring.
            verify=False,
            headers={"Accept": "application/json"},
        )
    except requests.Timeout:
        return _fail("timeout")
    except requests.ConnectionError:
        return _fail("network")
    except requests.RequestException:
        return _fail("network")

    if response.status_code != 200:
        return _fail("upstream", f"HTTP {response.status_code}")

    try:
        payload = response.json()
    except ValueError:
        return _fail("malformed")

    if not isinstance(payload, dict):
        return _fail("malformed")

    code = payload.get("code")
    if code is not None and code != 200:
        return _fail("upstream", _str(payload.get("desc")) or f"code {code}")

    data = payload.get("data")
    if not isinstance(data, dict):
        return _fail("not_found")

    balance = _num(data.get("balance"))
    if balance is None:
        # A meter with no balance field is not a zero-balance meter; it is a
        # failed lookup. Reporting 0 here would fire a bogus critical alert.
        return _fail("not_found", "balance field absent or unparseable")

    return {
        "ok": True,
        "data": {
            "accountNo": _str(data.get("accountNo")) or account_no,
            "meterNo": _str(data.get("meterNo")) or meter_no,
            "balance": balance,
            "currentMonthConsumption": _num(data.get("currentMonthConsumption")),
            "readingTime": _parse_reading_time(data.get("readingTime")),
        },
    }
