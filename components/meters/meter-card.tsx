"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MoreVertical,
  RefreshCw,
  Pencil,
  Trash2,
  ExternalLink,
  Wallet,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/status-badge";
import { checkMeterBalanceAction } from "@/app/actions/meters";
import { resolveDisplayStatus } from "@/lib/constants";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { Meter } from "@/types";

/**
 * Single meter tile for the /meters grid.
 *
 * "Check Now" is owned by the card (a self-contained server-action call), while
 * edit/delete are delegated up to the parent view via callbacks so their
 * dialogs stay mounted once regardless of how many cards render.
 */
export function MeterCard({
  meter,
  onEdit,
  onDelete,
}: {
  meter: Meter;
  onEdit: (meter: Meter) => void;
  onDelete: (meter: Meter) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [checking, startCheck] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayStatus = resolveDisplayStatus(meter);

  function handleCheckNow() {
    startCheck(async () => {
      const result = await checkMeterBalanceAction({ id: meter.id });
      if (result.success) {
        toast.success(t(result.message as TranslationKey));
        router.refresh();
      } else {
        toast.error(t(result.error as TranslationKey));
      }
    });
  }

  return (
    <Card className="flex flex-col">
      <CardContent className="flex-1 space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <Link
              href={`/meters/${meter.id}`}
              className="block truncate font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {meter.name}
            </Link>
            <p className="truncate text-xs text-muted-foreground tabular">
              {meter.meter_number}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <StatusBadge status={displayStatus} />
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={t("meters.actions")}
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/meters/${meter.id}`}>
                    <ExternalLink className="size-4" aria-hidden="true" />
                    {t("meters.view")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onEdit(meter)}>
                  <Pencil className="size-4" aria-hidden="true" />
                  {t("meters.edit")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => onDelete(meter)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  {t("meters.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wallet className="size-3.5" aria-hidden="true" />
            {t("meters.prepaidBalance")}
          </p>
          <p className="text-2xl font-bold tabular">
            {formatCurrency(meter.current_balance)}
          </p>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden="true" />
          {meter.last_checked_at
            ? `${t("meters.lastChecked")}: ${formatRelativeTime(meter.last_checked_at)}`
            : t("meters.neverChecked")}
        </p>
      </CardContent>

      <CardFooter className="gap-2 border-t border-border/60 p-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleCheckNow}
          loading={checking}
        >
          {!checking && <RefreshCw className="size-4" aria-hidden="true" />}
          {checking ? t("meters.checking") : t("meters.checkNow")}
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/meters/${meter.id}`}>{t("meters.view")}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
