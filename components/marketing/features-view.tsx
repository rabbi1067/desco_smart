"use client";

import { Section, Eyebrow } from "@/components/marketing/section";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { useTranslation } from "@/lib/i18n";

export function FeaturesView() {
  const { t } = useTranslation();
  return (
    <Section>
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>{t("features.eyebrow")}</Eyebrow>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {t("features.title")}
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          {t("features.subtitle")}
        </p>
      </div>
      <FeatureGrid />
    </Section>
  );
}
