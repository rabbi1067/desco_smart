"""
Email delivery for balance alerts, using only the Python standard library
(``smtplib`` + ``email.mime``) — no third-party email dependency.

Delivery uses STARTTLS (default port 587). Credentials come from :class:`Config`,
which reads them from the environment; they are never logged. If SMTP is not
configured the caller records the alert as ``skipped`` and this module is not
invoked — but the send functions still guard defensively.

Each function returns ``(ok: bool, error: str | None)`` and never raises, so a
delivery failure degrades to a recorded ``failed`` alert instead of aborting the
run.

PRIVACY
-------
The email body MAY contain the meter number (it goes only to the meter's owner),
but we mask all but the last four digits as a courtesy in case the mail is
forwarded. The meter number is NEVER written to logs.
"""

from __future__ import annotations

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from typing import Optional, Tuple

from .config import Config

_SMTP_TIMEOUT_SECONDS = 30

# Severity accent colours for the email header band.
_COLOR_CRITICAL = "#dc2626"
_COLOR_LOW = "#d97706"
_COLOR_RECOVERY = "#16a34a"


def _taka(amount: Optional[float]) -> str:
    """Format a BDT amount with the taka sign, e.g. ৳1,234.50."""
    if amount is None:
        return "৳—"
    return f"৳{amount:,.2f}"


def mask_meter_number(meter_number: Optional[str]) -> str:
    """Mask all but the last four digits (e.g. ``••••1234``)."""
    if not meter_number:
        return "—"
    digits = meter_number.strip()
    if len(digits) <= 4:
        return digits
    return "•" * (len(digits) - 4) + digits[-4:]


def _send(
    config: Config,
    to_email: str,
    subject: str,
    text_body: str,
    html_body: str,
) -> Tuple[bool, Optional[str]]:
    """Send one multipart (plain + HTML) message over STARTTLS.

    Returns (True, None) on success or (False, reason) on any failure. The
    password never appears in the returned reason.
    """
    if not config.email_configured:
        return False, "email not configured"

    from_address = config.email_user or ""
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = formataddr((config.email_from_name, from_address))
    message["To"] = to_email
    # Order matters: the plain-text fallback first, the richer HTML last.
    message.attach(MIMEText(text_body, "plain", "utf-8"))
    message.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP(config.smtp_host, config.smtp_port, timeout=_SMTP_TIMEOUT_SECONDS) as server:
            server.ehlo()
            server.starttls()  # upgrade the plaintext connection to TLS (port 587)
            server.ehlo()
            server.login(from_address, config.email_pass or "")
            server.sendmail(from_address, [to_email], message.as_string())
        return True, None
    except (smtplib.SMTPException, OSError) as exc:
        # SMTP errors carry server response text, not our credentials.
        return False, f"{exc.__class__.__name__}: {str(exc)[:200]}"


def _greeting(to_name: Optional[str]) -> str:
    name = (to_name or "").strip()
    return f"Hi {name}," if name else "Hello,"


def _wrap_html(accent: str, heading: str, intro: str, rows: list, footer: str) -> str:
    """Assemble a simple, email-client-safe HTML body with inline styles."""
    row_html = "".join(
        f"""
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px;">{label}</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">{value}</td>
        </tr>"""
        for label, value in rows
    )
    return f"""\
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:480px;width:100%;">
            <tr>
              <td style="background:{accent};padding:20px 28px;">
                <div style="color:#ffffff;font-size:18px;font-weight:700;">DESCO Smart</div>
                <div style="color:#ffffff;opacity:0.9;font-size:14px;margin-top:2px;">{heading}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.5;">{intro}</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
                  {row_html}
                </table>
                <p style="margin:16px 0 0;color:#374151;font-size:14px;line-height:1.5;">{footer}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background:#f9fafb;color:#9ca3af;font-size:12px;line-height:1.5;">
                You are receiving this because balance alerts are enabled for this meter.
                Manage alerts in your DESCO Smart dashboard.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""


def send_low_balance_email(
    config: Config,
    *,
    to_email: str,
    to_name: Optional[str],
    meter_name: str,
    meter_number: Optional[str],
    balance: float,
    threshold: float,
    critical_threshold: float,
    is_critical: bool,
) -> Tuple[bool, Optional[str]]:
    """Send a low- or critical-balance alert email to the meter owner."""
    severity = "Critical" if is_critical else "Low"
    accent = _COLOR_CRITICAL if is_critical else _COLOR_LOW
    active_threshold = critical_threshold if is_critical else threshold
    subject = f"{severity} balance alert — {meter_name}"

    urgency = (
        "Your balance is critically low. Please recharge now to avoid an "
        "interruption to your electricity supply."
        if is_critical
        else "Your balance is running low. Recharging soon will keep your supply "
        "uninterrupted."
    )

    rows = [
        ("Meter", meter_name),
        ("Meter number", mask_meter_number(meter_number)),
        ("Current balance", _taka(balance)),
        (f"{severity} threshold", _taka(active_threshold)),
        ("Status", severity),
    ]
    html_body = _wrap_html(
        accent=accent,
        heading=f"{severity} balance alert",
        intro=f"{_greeting(to_name)} the balance on <strong>{meter_name}</strong> needs your attention.",
        rows=rows,
        footer=urgency,
    )
    text_body = (
        f"{_greeting(to_name)}\n\n"
        f"{severity} balance alert for {meter_name}.\n\n"
        f"Meter number: {mask_meter_number(meter_number)}\n"
        f"Current balance: {_taka(balance)}\n"
        f"{severity} threshold: {_taka(active_threshold)}\n"
        f"Status: {severity}\n\n"
        f"{urgency}\n\n"
        f"— DESCO Smart"
    )
    return _send(config, to_email, subject, text_body, html_body)


def send_recovery_email(
    config: Config,
    *,
    to_email: str,
    to_name: Optional[str],
    meter_name: str,
    meter_number: Optional[str],
    balance: float,
    threshold: float,
) -> Tuple[bool, Optional[str]]:
    """Send a one-off recovery email once the balance climbs clear of the threshold."""
    subject = f"Balance recovered — {meter_name}"
    message = (
        "Good news — the balance is back above your alert threshold. No action is "
        "needed. We will let you know if it drops again."
    )
    rows = [
        ("Meter", meter_name),
        ("Meter number", mask_meter_number(meter_number)),
        ("Current balance", _taka(balance)),
        ("Low threshold", _taka(threshold)),
        ("Status", "Healthy"),
    ]
    html_body = _wrap_html(
        accent=_COLOR_RECOVERY,
        heading="Balance recovered",
        intro=f"{_greeting(to_name)} the balance on <strong>{meter_name}</strong> has recovered.",
        rows=rows,
        footer=message,
    )
    text_body = (
        f"{_greeting(to_name)}\n\n"
        f"Balance recovered for {meter_name}.\n\n"
        f"Meter number: {mask_meter_number(meter_number)}\n"
        f"Current balance: {_taka(balance)}\n"
        f"Low threshold: {_taka(threshold)}\n"
        f"Status: Healthy\n\n"
        f"{message}\n\n"
        f"— DESCO Smart"
    )
    return _send(config, to_email, subject, text_body, html_body)
