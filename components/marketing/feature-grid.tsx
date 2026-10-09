"use client";

import {
  Bell,
  BarChart3,
  Clock,
  Gauge,
  History,
  Languages,
  Mail,
  Palette,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

const FEATURES: {
  icon: LucideIcon;
  titleKey: TranslationKey;
  descKey: TranslationKey;
}[] = [
  {
    icon: Gauge,
    titleKey: "features.multiMeter.title",
    descKey: "features.multiMeter.desc",
  },
  {
    icon: Bell,
    titleKey: "features.alerts.title",
    descKey: "features.alerts.desc",
  },
  {
    icon: Mail,
    titleKey: "features.email.title",
    descKey: "features.email.desc",
  },
  {
    icon: BarChart3,
    titleKey: "features.analytics.title",
    descKey: "features.analytics.desc",
  },
  {
    icon: History,
    titleKey: "features.history.title",
    descKey: "features.history.desc",
  },
  {
    icon: Clock,
    titleKey: "features.automated.title",
    descKey: "features.automated.desc",
  },
  {
    icon: ShieldCheck,
    titleKey: "features.secure.title",
    descKey: "features.secure.desc",
  },
  {
    icon: Languages,
    titleKey: "features.bilingual.title",
    descKey: "features.bilingual.desc",
  },
  {
    icon: Palette,
    titleKey: "features.theme.title",
    descKey: "features.theme.desc",
  },
];

export function FeatureGrid() {
  const { t } = useTranslation();

  return (
    <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((feature) => {
        const Icon = feature.icon;
        return (
          <Card
            key={feature.titleKey}
            className="group border-border/60 transition-colors hover:border-primary/40"
          >
            <CardContent className="p-6">
              <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold">
                {t(feature.titleKey)}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(feature.descKey)}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
