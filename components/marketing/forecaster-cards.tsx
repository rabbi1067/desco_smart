"use client";

import {
  CalendarClock,
  Info,
  LineChart,
  TrendingDown,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

const METRICS: {
  icon: LucideIcon;
  titleKey: TranslationKey;
  descKey: TranslationKey;
}[] = [
  { icon: CalendarClock, titleKey: "ai.metric1", descKey: "ai.metric1desc" },
  { icon: TrendingDown, titleKey: "ai.metric2", descKey: "ai.metric2desc" },
  { icon: Wallet, titleKey: "ai.metric3", descKey: "ai.metric3desc" },
  { icon: LineChart, titleKey: "ai.metric4", descKey: "ai.metric4desc" },
];

export function ForecasterCards() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto mt-12 max-w-4xl">
      <div className="grid gap-5 sm:grid-cols-2">
        {METRICS.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.titleKey} className="border-border/60">
              <CardContent className="flex gap-4 p-6">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">
                    {t(metric.titleKey)}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {t(metric.descKey)}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Honesty disclaimer — no fabricated accuracy percentage. */}
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-border/60 bg-muted/40 p-5">
        <Info
          className="mt-0.5 size-5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">{t("ai.honesty")}</p>
      </div>
    </div>
  );
}
