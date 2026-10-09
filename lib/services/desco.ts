import {
  DESCO_API_BASE,
  DESCO_DAILY_CACHE_SECONDS,
  DESCO_MONTHLY_CACHE_SECONDS,
  DESCO_RECHARGE_CACHE_SECONDS,
  DESCO_REQUEST_TIMEOUT_MS,
} from "@/lib/constants";

/**
 * Adapter for the DESCO prepaid customer API.
 *
 * ORIGIN OF THIS INTEGRATION
 * --------------------------
 * The endpoint and query-parameter shape are taken verbatim from the existing
 * repository's `desco_check.py`, which used:
 *
 *   https://prepaid.desco.org.bd/api/tkdes/customer/getBalance
 *     ?accountNo=<account>&meterNo=<meter>
 *
 * Nothing here is invented. The three additional endpoints below were confirmed
 * against the live service before being typed.
 *
 * AUTHENTICATION
 * --------------
 * These endpoints are public: they are authorised purely by knowing the account
 * and meter numbers. No cookie, token, username or password is involved. The
 * original script sent none either. Consequently this adapter has no credential
 * handling — adding fake DESCO credentials would be theatre.
 *
 * TLS
 * ---
 * `desco_check.py` used `verify=False` with `urllib3.disable_warnings`, because
 * Python's certifi bundle rejects DESCO's certificate chain. Node's fetch
 * validates the same chain successfully (verified against the live host), so no
 * TLS bypass is needed or wanted here. The Python worker keeps `verify=False`
 * to preserve the original working behaviour.
 *
 * ERROR MODEL
 * -----------
 * Every function returns a discriminated result rather than throwing. A failed
 * check must be recorded as a failure, never silently treated as a success or
 * as a zero balance — a fabricated 0 would trigger a false critical alert.
 */

export interface DescoBalance {
  accountNo: string;
  meterNo: string;
  balance: number;
  currentMonthConsumption: number | null;
  /** DESCO's own reading timestamp, as an ISO string in Asia/Dhaka. */
  readingTime: string | null;
}

export interface DescoDailyConsumption {
  date: string;
  consumedTaka: number;
  consumedUnit: number | null;
}

export interface DescoMonthlyConsumption {
  month: string;
  consumedTaka: number;
  consumedUnit: number | null;
  customerName: string | null;
  installationAddress: string | null;
  tariffSolution: string | null;
  sanctionLoad: number | null;
  phaseType: string | null;
  maximumDemand: number | null;
}

export interface DescoRecharge {
  orderId: string;
  rechargeDate: string;
  totalAmount: number;
  energyAmount: number;
  vat: number;
  rebate: number;
  status: string;
  tariffSolutionName: string | null;
  /** Never logged or exported — treated as sensitive. */
  tokenNo: string | null;
}

export type DescoResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; kind: DescoErrorKind };

export type DescoErrorKind =
  | "not_found"
  | "network"
  | "timeout"
  | "upstream"
  | "malformed";

/** Envelope every DESCO endpoint wraps its payload in. */
interface DescoEnvelope<T> {
  code?: number;
  desc?: string;
  data?: T;
}

/** Human-readable message per failure kind. Never leaks internals to the UI. */
const ERROR_MESSAGES: Record<DescoErrorKind, string> = {
  not_found:
    "DESCO could not find this meter. Verify the meter and account numbers.",
  network: "Could not reach the DESCO service. Please try again shortly.",
  timeout: "The DESCO service did not respond in time. Please try again.",
  upstream: "The DESCO service returned an unexpected response.",
  malformed: "The DESCO service returned data in an unrecognised format.",
};

function fail<T>(kind: DescoErrorKind, detail?: string): DescoResult<T> {
  return {
    ok: false,
    kind,
    error: detail ? `${ERROR_MESSAGES[kind]} (${detail})` : ERROR_MESSAGES[kind],
  };
}

/**
 * Coerces DESCO's loosely-typed numerics.
 * Returns null rather than 0 for absent values — 0 is a meaningful balance and
 * must never be manufactured from missing data.
 */
function num(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

/**
 * DESCO returns "YYYY-MM-DD HH:mm:ss" with no zone. It is Dhaka local time
 * (UTC+6, no DST), so the offset is appended explicitly instead of letting the
 * runtime guess — otherwise a server in UTC would shift every timestamp 6h.
 */
function parseDescoTimestamp(raw: unknown): string | null {
  const value = str(raw);
  if (!value) return null;
  const normalised = value.includes("T") ? value : value.replace(" ", "T");
  const withZone = /[Z+]|-\d{2}:\d{2}$/.test(normalised)
    ? normalised
    : `${normalised}+06:00`;
  const date = new Date(withZone);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function descoFetch<T>(
  path: string,
  params: Record<string, string>,
  revalidateSeconds?: number,
): Promise<DescoResult<T>> {
  const url = new URL(`${DESCO_API_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  // Historical endpoints pass a revalidate window so Next.js serves a cached
  // copy and shields the upstream API; live balance passes nothing and is
  // always fetched fresh.
  const cacheOption: { cache: "no-store" } | { next: { revalidate: number } } =
    revalidateSeconds && revalidateSeconds > 0
      ? { next: { revalidate: revalidateSeconds } }
      : { cache: "no-store" };

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(DESCO_REQUEST_TIMEOUT_MS),
      ...cacheOption,
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      return fail<T>("timeout");
    }
    return fail<T>("network");
  }

  if (!response.ok) {
    return fail<T>("upstream", `HTTP ${response.status}`);
  }

  let payload: DescoEnvelope<T>;
  try {
    payload = (await response.json()) as DescoEnvelope<T>;
  } catch {
    return fail<T>("malformed");
  }

  if (payload.code !== undefined && payload.code !== 200) {
    return fail<T>("upstream", payload.desc ?? `code ${payload.code}`);
  }
  if (payload.data === undefined || payload.data === null) {
    return fail<T>("not_found");
  }

  return { ok: true, data: payload.data };
}

/**
 * Fetches the current prepaid balance for a meter.
 * This is the direct successor to the original script's single API call.
 */
export async function getBalance(
  accountNo: string,
  meterNo: string,
): Promise<DescoResult<DescoBalance>> {
  const result = await descoFetch<Record<string, unknown>>("getBalance", {
    accountNo,
    meterNo,
  });
  if (!result.ok) return result;

  const balance = num(result.data.balance);
  // A meter with no balance field is not a zero-balance meter; it is a failed
  // lookup. Reporting 0 here would fire a bogus critical alert.
  if (balance === null) return fail<DescoBalance>("not_found");

  return {
    ok: true,
    data: {
      accountNo: str(result.data.accountNo) ?? accountNo,
      meterNo: str(result.data.meterNo) ?? meterNo,
      balance,
      currentMonthConsumption: num(result.data.currentMonthConsumption),
      readingTime: parseDescoTimestamp(result.data.readingTime),
    },
  };
}

/** Daily consumption in taka — drives the burn-rate and daily-trend charts. */
export async function getDailyConsumption(
  accountNo: string,
  meterNo: string,
  dateFrom: string,
  dateTo: string,
): Promise<DescoResult<DescoDailyConsumption[]>> {
  const result = await descoFetch<unknown>(
    "getCustomerDailyConsumption",
    {
      accountNo,
      meterNo,
      dateFrom,
      dateTo,
    },
    DESCO_DAILY_CACHE_SECONDS,
  );
  if (!result.ok) return result;
  if (!Array.isArray(result.data)) {
    return fail<DescoDailyConsumption[]>("malformed");
  }

  const rows = (result.data as Record<string, unknown>[])
    .map((row) => {
      const date = str(row.date);
      const consumedTaka = num(row.consumedTaka);
      if (!date || consumedTaka === null) return null;
      return { date, consumedTaka, consumedUnit: num(row.consumedUnit) };
    })
    .filter((row): row is DescoDailyConsumption => row !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  return { ok: true, data: rows };
}

/**
 * Monthly consumption. Also the only endpoint that carries meter metadata
 * (customer name, address, tariff, sanctioned load), which is why meter details
 * are synced from here rather than being typed in by the user.
 */
export async function getMonthlyConsumption(
  accountNo: string,
  meterNo: string,
  monthFrom: string,
  monthTo: string,
): Promise<DescoResult<DescoMonthlyConsumption[]>> {
  const result = await descoFetch<unknown>(
    "getCustomerMonthlyConsumption",
    {
      accountNo,
      meterNo,
      monthFrom,
      monthTo,
    },
    DESCO_MONTHLY_CACHE_SECONDS,
  );
  if (!result.ok) return result;
  if (!Array.isArray(result.data)) {
    return fail<DescoMonthlyConsumption[]>("malformed");
  }

  const rows = (result.data as Record<string, unknown>[])
    .map((row) => {
      const month = str(row.month);
      if (!month) return null;
      return {
        month,
        consumedTaka: num(row.consumedTaka) ?? 0,
        consumedUnit: num(row.consumedUnit),
        customerName: str(row.customerName),
        installationAddress: str(row.installationAddress),
        tariffSolution: str(row.tariffSolution),
        sanctionLoad: num(row.sanctionLoad),
        phaseType: str(row.phaseType),
        maximumDemand: num(row.maximumDemand),
      };
    })
    .filter((row): row is DescoMonthlyConsumption => row !== null)
    .sort((a, b) => a.month.localeCompare(b.month));

  return { ok: true, data: rows };
}

/** Recharge history — real top-up records, not a simulated payment feature. */
export async function getRechargeHistory(
  accountNo: string,
  meterNo: string,
  dateFrom: string,
  dateTo: string,
): Promise<DescoResult<DescoRecharge[]>> {
  const result = await descoFetch<unknown>(
    "getRechargeHistory",
    {
      accountNo,
      meterNo,
      dateFrom,
      dateTo,
    },
    DESCO_RECHARGE_CACHE_SECONDS,
  );
  if (!result.ok) return result;
  if (!Array.isArray(result.data)) {
    return fail<DescoRecharge[]>("malformed");
  }

  const rows = (result.data as Record<string, unknown>[])
    .map((row) => {
      const rechargeDate = parseDescoTimestamp(row.rechargeDate);
      const totalAmount = num(row.totalAmount);
      if (!rechargeDate || totalAmount === null) return null;
      return {
        orderId: str(row.orderID) ?? str(row.orderId) ?? "",
        rechargeDate,
        totalAmount,
        energyAmount: num(row.energyAmount) ?? 0,
        vat: num(row.VAT) ?? num(row.vat) ?? 0,
        rebate: num(row.rebate) ?? 0,
        status: str(row.orderStatus) ?? "unknown",
        tariffSolutionName: str(row.tariffSolutionName),
        tokenNo: str(row.tokenNo),
      };
    })
    .filter((row): row is DescoRecharge => row !== null)
    .sort((a, b) => b.rechargeDate.localeCompare(a.rechargeDate));

  return { ok: true, data: rows };
}

/**
 * Confirms a meter exists before it is saved, so a typo surfaces immediately
 * instead of becoming a meter that silently fails every scheduled check.
 */
export async function verifyMeter(
  accountNo: string,
  meterNo: string,
): Promise<DescoResult<DescoBalance>> {
  return getBalance(accountNo, meterNo);
}
