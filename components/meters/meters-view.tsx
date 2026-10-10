"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Gauge, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { MeterCard } from "./meter-card";
import { MeterFormDialog } from "./meter-form-dialog";
import { DeleteMeterDialog } from "./delete-meter-dialog";
import { resolveDisplayStatus } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n";
import type { Meter, MeterStatus } from "@/types";

type StatusFilter = "all" | MeterStatus;

/**
 * Client shell for the meters page.
 *
 * The server passes the already-scoped meter list (RLS + explicit user filter);
 * this component only handles interaction — search, status filtering, and the
 * three shared dialogs. Filtering is done client-side over a list that is small
 * by nature (one household's meters), so there's no need to round-trip.
 */
export function MetersView({
  meters,
  userEmail,
}: {
  meters: Meter[];
  userEmail?: string;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  // Dialog state is hoisted here so a single instance of each dialog serves
  // every card — the card callbacks just set the target meter.
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Meter | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Meter | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return meters.filter((meter) => {
      const matchesQuery =
        q === "" ||
        meter.name.toLowerCase().includes(q) ||
        meter.meter_number.toLowerCase().includes(q) ||
        meter.account_number.toLowerCase().includes(q);
      const matchesStatus =
        status === "all" || resolveDisplayStatus(meter) === status;
      return matchesQuery && matchesStatus;
    });
  }, [meters, query, status]);

  const statusOptions: StatusFilter[] = [
    "all",
    "healthy",
    "low",
    "critical",
    "error",
    "disabled",
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("meters.search")}
              className="pl-9 pr-9 h-10 rounded-xl bg-card border-border/80 focus:border-emerald-500/70"
              aria-label={t("meters.search")}
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

          <Select
            value={status}
            onValueChange={(value) => setStatus(value as StatusFilter)}
          >
            <SelectTrigger className="sm:w-44 h-10 rounded-xl" aria-label={t("meters.filter")}>
              <SelectValue placeholder={t("meters.filter")} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "all"
                    ? t("meters.all")
                    : t(`status.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => setAddOpen(true)} className="h-10 rounded-xl">
            <Plus className="size-4" aria-hidden="true" />
            {t("dash.addMeter")}
          </Button>
        </div>

        {(query.trim().length > 0 || status !== "all") && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Showing <strong className="text-foreground">{filtered.length}</strong> of {meters.length} meters
            </span>
            {(query.trim().length > 0 || status !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                }}
                className="text-[11px] text-emerald-400 hover:underline ml-1"
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid / empty states */}
      {filtered.length === 0 ? (
        meters.length === 0 ? (
          <EmptyState
            icon={Gauge}
            title={t("empty.noMeters")}
            description={t("empty.noMetersDesc")}
            action={
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="size-4" aria-hidden="true" />
                {t("dash.addMeter")}
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Search}
            title={t("empty.noResults")}
            description={t("empty.noResultsDesc")}
            compact
          />
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((meter) => (
            <MeterCard
              key={meter.id}
              meter={meter}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Shared dialogs */}
      <MeterFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        userEmail={userEmail}
      />

      <MeterFormDialog
        key={editTarget?.id ?? "edit"}
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        meter={editTarget ?? undefined}
        userEmail={userEmail}
      />

      {deleteTarget && (
        <DeleteMeterDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          meter={deleteTarget}
        />
      )}
    </div>
  );
}
