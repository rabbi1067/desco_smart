import "server-only";

import { getAuthedUserId } from "@/lib/auth";
import { estimateRemainingDays, PERIOD_DAYS } from "@/lib/constants";
import { toISODate } from "@/lib/utils";
import { getBalanceHistory, getMeterById, getMeters } from "./meters";
import { getDailyConsumption, getRechargeHistory } from "./desco";
import type {
  AnalyticsData,
  AnalyticsPeriod,
  BalancePoint,
  ConsumptionPoint,
  RechargeRecord,
} from "@/types";

/**
 * Analytics assembly.
 *
 * Two genuine sources, no synthesis:
 *   1. `balance_readings` — our own recorded time series (balance trajectory).
 *   2. The DESCO API — daily consumption and recharge history.
 *
 * When neither has usable rows, `isEmpty` is true and the UI shows an empty
 * state. No placeholder series is ever generated to make a chart look full.
 */

const EMPTY_ANALYTICS: AnalyticsData = {
  balanceHistory: [],
  consumption: [],
  recharges: [],
  averageDailyUsage: null,
  highestUsage: null,
  lowestUsage: null,
  rechargeCount: 0,
  estimatedRunoutDate: null,
  remainingDays: null,
  currentBalance: null,
  isEmpty: true,
};

function resolveRange(
  period: AnalyticsPeriod,
  dateFrom?: string,
  dateTo?: string,
): { from: string; to: string } {
  const today = new Date();
  if (period === "custom" && dateFrom && dateTo) {
    return { from: dateFrom, to: dateTo };
  }
  const days = PERIOD_DAYS[period as "7d" | "14d" | "30d"] ?? 7;
  const from = new Date(today);
  from.setDate(from.getDate() - (days - 1));
  return { from: toISODate(from), to: toISODate(today) };
}

/**
 * Derives average daily burn from DESCO's own daily figures when available,
 * otherwise from the slope of our stored balance readings.
 *
 * Returns null rather than 0 when there is not enough data — a 0 would make
 * `estimateRemainingDays` claim infinite runway.
 */
function computeAverageDailyUsage(
  consumption: ConsumptionPoint[],
  balanceHistory: BalancePoint[],
): number | null {
  const positive = consumption.filter((c) => c.consumed > 0);
  if (positive.length > 0) {
    const total = positive.reduce((sum, c) => sum + c.consumed, 0);
    return Math.round((total / positive.length) * 100) / 100;
  }

  // Fallback: total decline across the recorded window / days spanned.
  // Recharges push the balance *up*, so only net decline is counted; a window
  // that ends higher than it started yields null, not a negative burn rate.
  if (balanceHistory.length < 2) return null;
  const first = balanceHistory[0];
  const last = balanceHistory[balanceHistory.length - 1];
  const decline = first.balance - last.balance;
  if (decline <= 0) return null;

  const spanMs =
    new Date(last.date).getTime() - new Date(first.date).getTime();
  const spanDays = spanMs / 86_400_000;
  if (spanDays < 1) return null;

  return Math.round((decline / spanDays) * 100) / 100;
}

function projectRunoutDate(
  balance: number | null,
  remainingDays: number | null,
): string | null {
  if (balance === null || remainingDays === null || remainingDays <= 0) {
    return null;
  }
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(remainingDays));
  return date.toISOString();
}

/**
 * Analytics for a single meter. Consumption and recharge data come from DESCO
 * live; a DESCO outage degrades gracefully to balance-history-only rather than
 * failing the whole page.
 */
export async function getMeterAnalytics(
  meterId: string,
  period: AnalyticsPeriod = "7d",
  dateFrom?: string,
  dateTo?: string,
): Promise<AnalyticsData> {
  const meter = await getMeterById(meterId);
  if (!meter) return EMPTY_ANALYTICS;

  const { from, to } = resolveRange(period, dateFrom, dateTo);

  const readings = await getBalanceHistory(meterId, 500);
  // ISO timestamps sort lexically against a YYYY-MM-DD bound, so a string
  // comparison correctly filters to the window without parsing every row.
  const balanceHistory: BalancePoint[] = readings
    .filter((r) => r.checked_at >= from)
    .map((r) => ({ date: r.checked_at, balance: Number(r.balance) }));

  // Fetched in parallel: neither depends on the other.
  const [dailyResult, rechargeResult] = await Promise.all([
    getDailyConsumption(meter.account_number, meter.meter_number, from, to),
    getRechargeHistory(meter.account_number, meter.meter_number, from, to),
  ]);

  const consumption: ConsumptionPoint[] = dailyResult.ok
    ? dailyResult.data.map((d) => ({ date: d.date, consumed: d.consumedTaka }))
    : [];

  const recharges: RechargeRecord[] = rechargeResult.ok
    ? rechargeResult.data.map((r) => ({
        orderId: r.orderId,
        rechargeDate: r.rechargeDate,
        totalAmount: r.totalAmount,
        energyAmount: r.energyAmount,
        vat: r.vat,
        status: r.status,
        tariff: r.tariffSolutionName,
        // tokenNo is intentionally dropped: it is a redeemable secret and has
        // no place in the analytics payload sent to the browser.
      }))
    : [];

  const consumedValues = consumption
    .map((c) => c.consumed)
    .filter((v) => v > 0);

  const averageDailyUsage = computeAverageDailyUsage(
    consumption,
    balanceHistory,
  );
  const currentBalance =
    typeof meter.current_balance === "number" ? meter.current_balance : null;
  const remainingDays = estimateRemainingDays(currentBalance, averageDailyUsage);

  const isEmpty =
    balanceHistory.length === 0 &&
    consumption.length === 0 &&
    recharges.length === 0;

  return {
    balanceHistory,
    consumption,
    recharges,
    averageDailyUsage,
    highestUsage: consumedValues.length ? Math.max(...consumedValues) : null,
    lowestUsage: consumedValues.length ? Math.min(...consumedValues) : null,
    rechargeCount: recharges.length,
    estimatedRunoutDate: projectRunoutDate(currentBalance, remainingDays),
    remainingDays,
    currentBalance,
    isEmpty,
  };
}

/**
 * Fleet-wide analytics: consumption summed per day across every active meter,
 * balance history summed per day.
 */
export async function getFleetAnalytics(
  period: AnalyticsPeriod = "7d",
  dateFrom?: string,
  dateTo?: string,
): Promise<AnalyticsData> {
  const userId = await getAuthedUserId();
  if (!userId) return EMPTY_ANALYTICS;

  const meters = await getMeters();
  if (meters.length === 0) return EMPTY_ANALYTICS;

  // A single meter fleet is just that meter's analytics — avoids pointless
  // aggregation and keeps the DESCO call count at one.
  if (meters.length === 1) {
    return getMeterAnalytics(meters[0].id, period, dateFrom, dateTo);
  }

  const { from, to } = resolveRange(period, dateFrom, dateTo);

  // Process meters in small batches (3 at a time) instead of fanning out to
  // N parallel DESCO calls. A 10-meter fleet previously fired 20 upstream
  // requests at once — slow and prone to timeouts. Batches keep the page
  // fast and stay polite to the public DESCO API. History fetch reuses the
  // DESCO fetch cache (15 min) so repeat views are cheap.
  async function fetchOne(meter: (typeof meters)[number]) {
    const [daily, recharge] = await Promise.all([
      getDailyConsumption(meter.account_number, meter.meter_number, from, to),
      getRechargeHistory(meter.account_number, meter.meter_number, from, to),
    ]);
    return {
      daily: daily.ok ? daily.data : [],
      recharges: recharge.ok ? recharge.data : [],
      readings: await getBalanceHistory(meter.id, 200),
    };
  }
  type OneResult = Awaited<ReturnType<typeof fetchOne>>;
  const perMeter: OneResult[] = [];
  const BATCH_SIZE = 3;
  for (let i = 0; i < meters.length; i += BATCH_SIZE) {
    const batch = meters.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(fetchOne));
    perMeter.push(...results);
  }

  // Sum consumption by calendar date across meters.
  const consumptionByDate = new Map<string, number>();
  for (const entry of perMeter) {
    for (const row of entry.daily) {
      consumptionByDate.set(
        row.date,
        (consumptionByDate.get(row.date) ?? 0) + row.consumedTaka,
      );
    }
  }
  const consumption: ConsumptionPoint[] = [...consumptionByDate.entries()]
    .map(([date, consumed]) => ({ date, consumed }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Sum balances by day. Each meter contributes its last reading of that day,
  // so multiple checks in one day don't double-count.
  const balanceByDate = new Map<string, Map<string, number>>();
  for (const [index, entry] of perMeter.entries()) {
    const meterId = meters[index].id;
    for (const reading of entry.readings) {
      const day = reading.checked_at.slice(0, 10);
      if (day < from) continue;
      const dayMap = balanceByDate.get(day) ?? new Map<string, number>();
      dayMap.set(meterId, Number(reading.balance));
      balanceByDate.set(day, dayMap);
    }
  }
  const balanceHistory: BalancePoint[] = [...balanceByDate.entries()]
    .map(([date, meterBalances]) => ({
      date,
      balance: [...meterBalances.values()].reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const recharges: RechargeRecord[] = perMeter
    .flatMap((entry) => entry.recharges)
    .map((r) => ({
      orderId: r.orderId,
      rechargeDate: r.rechargeDate,
      totalAmount: r.totalAmount,
      energyAmount: r.energyAmount,
      vat: r.vat,
      status: r.status,
      tariff: r.tariffSolutionName,
    }))
    .sort((a, b) => b.rechargeDate.localeCompare(a.rechargeDate));

  const consumedValues = consumption.map((c) => c.consumed).filter((v) => v > 0);
  const averageDailyUsage = computeAverageDailyUsage(
    consumption,
    balanceHistory,
  );

  const totalBalance = meters.reduce(
    (sum, m) =>
      typeof m.current_balance === "number" ? sum + m.current_balance : sum,
    0,
  );
  const hasAnyBalance = meters.some(
    (m) => typeof m.current_balance === "number",
  );
  const currentBalance = hasAnyBalance ? totalBalance : null;
  const remainingDays = estimateRemainingDays(currentBalance, averageDailyUsage);

  return {
    balanceHistory,
    consumption,
    recharges,
    averageDailyUsage,
    highestUsage: consumedValues.length ? Math.max(...consumedValues) : null,
    lowestUsage: consumedValues.length ? Math.min(...consumedValues) : null,
    rechargeCount: recharges.length,
    estimatedRunoutDate: projectRunoutDate(currentBalance, remainingDays),
    remainingDays,
    currentBalance,
    isEmpty:
      balanceHistory.length === 0 &&
      consumption.length === 0 &&
      recharges.length === 0,
  };
}

/**
 * Splits a consumption series into this-week / last-week pairs for the weekly
 * comparison chart. Days with no reported consumption are null (a gap in the
 * line) rather than 0, which would imply zero usage.
 */
export function buildWeeklyComparison(
  consumption: ConsumptionPoint[],
): { day: string; thisWeek: number | null; lastWeek: number | null }[] {
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

  const thisWeek = new Array<number | null>(7).fill(null);
  const lastWeek = new Array<number | null>(7).fill(null);

  for (const point of consumption) {
    const date = new Date(`${point.date}T00:00:00+06:00`);
    if (Number.isNaN(date.getTime())) continue;
    if (date >= startOfThisWeek) {
      thisWeek[date.getDay()] = point.consumed;
    } else if (date >= startOfLastWeek) {
      lastWeek[date.getDay()] = point.consumed;
    }
  }

  return DAY_LABELS.map((day, index) => ({
    day,
    thisWeek: thisWeek[index],
    lastWeek: lastWeek[index],
  }));
}
