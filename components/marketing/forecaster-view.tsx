"use client";

import { Section, Eyebrow } from "@/components/marketing/section";
import { ForecasterCards } from "@/components/marketing/forecaster-cards";
import { useTranslation } from "@/lib/i18n";

export function ForecasterView() {
  const { t } = useTranslation();
  return (
    <Section>
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>{t("ai.eyebrow")}</Eyebrow>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {t("ai.title")}
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          {t("ai.subtitle")}
        </p>
      </div>
      <ForecasterCards />
    </Section>
  );
}
