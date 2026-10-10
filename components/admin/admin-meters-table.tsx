"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Gauge, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { resolveDisplayStatus } from "@/lib/constants";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { MeterWithOwner } from "@/types";

/**
 * Read-only system-wide meter directory with client-side search.
 *
 * Status is derived with the same `resolveDisplayStatus` used across the app, so
 * a monitoring-disabled meter reads "disabled" here too. No editing happens on
 * this screen — meters are owned and managed by their users.
 */
export function AdminMetersTable({ meters }: { meters: MeterWithOwner[] }) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams?.get("q") || "");

  useEffect(() => {
    const q = searchParams?.get("q");
    if (q !== null && q !== undefined) {
      setQuery(q);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return meters;
    return meters.filter((m) => {
      const haystack = [
        m.name,
        m.meter_number,
        m.account_number,
        m.owner?.full_name ?? "",
        m.owner?.email ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [meters, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("admin.meters.search")}
            aria-label={t("admin.meters.search")}
            className="pl-9 pr-9 h-10 rounded-xl bg-card border-border/80 focus:border-emerald-500/70"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {query.trim().length > 0 && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Found <strong className="text-foreground">{filtered.length}</strong> of {meters.length} meters
            </span>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Gauge}
          title={t("admin.meters.empty")}
          description={t("admin.meters.emptyDesc")}
        />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.meters.details")}</TableHead>
                <TableHead>{t("admin.meters.owner")}</TableHead>
                <TableHead className="text-right">
                  {t("admin.meters.currentBalance")}
                </TableHead>
                <TableHead className="text-right">
                  {t("admin.meters.thresholds")}
                </TableHead>
                <TableHead>{t("admin.users.status")}</TableHead>
                <TableHead>{t("admin.meters.lastSync")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((meter) => (
                <TableRow key={meter.id}>
                  <TableCell>
                    <p className="font-medium">{meter.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {meter.meter_number}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{meter.owner?.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {meter.owner?.email || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular">
                    {formatCurrency(meter.current_balance)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular text-muted-foreground">
                    {formatCurrency(meter.threshold)} /{" "}
                    {formatCurrency(meter.critical_threshold)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={resolveDisplayStatus(meter)} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {meter.last_checked_at
                      ? formatRelativeTime(meter.last_checked_at)
                      : t("common.never")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
