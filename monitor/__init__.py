"""
DESCO Smart monitoring worker.

A small, dependency-light Python package that polls the public DESCO prepaid
balance API for every actively-monitored meter, records each reading in Supabase,
and emails the owner when (and only when) a threshold breach or recovery warrants
it. Run it with:

    python -m monitor.main

The package deliberately mirrors the business rules in the Next.js app's
`lib/constants.ts` (see `monitor/config.py`) so the scheduled worker and the web
UI never disagree about what "low", "critical", or "recovered" means.
"""

__all__ = ["main"]
