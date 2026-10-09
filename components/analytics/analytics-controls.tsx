"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";
import type { AnalyticsPeriod, Meter } from "@/types";

/**
 * Period + meter selectors for the analytics page.
 *
 * State lives in the URL (`?meter=&period=`) so the server component can read it
 * and fetch the matching analytics — the selectors just navigate. This keeps the
 * heavy DESCO/DB work on the server and makes any view shareable/bookmarkable.
 */
export function AnalyticsControls({
  meters,
  currentMeter,
  currentPeriod,
}: {
  meters: Pick<Meter, "id" | "name">[];
  currentMeter: string;
  currentPeriod: AnalyticsPeriod;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "" || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const periods: { value: AnalyticsPeriod; labelKey: Parameters<typeof t>[0] }[] = [
    { value: "7d", labelKey: "analytics.period7" },
    { value: "14d", labelKey: "analytics.period14" },
    { value: "30d", labelKey: "analytics.period30" },
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {meters.length > 1 && (
        <Select
          value={currentMeter}
          onValueChange={(value) => setParam("meter", value)}
        >
          <SelectTrigger className="sm:w-56" aria-label={t("analytics.selectMeter")}>
            <SelectValue placeholder={t("analytics.selectMeter")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("analytics.allMeters")}</SelectItem>
            {meters.map((meter) => (
              <SelectItem key={meter.id} value={meter.id}>
                {meter.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={currentPeriod}
        onValueChange={(value) => setParam("period", value)}
      >
        <SelectTrigger className="sm:w-44" aria-label={t("analytics.period7")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {periods.map((period) => (
            <SelectItem key={period.value} value={period.value}>
              {t(period.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
