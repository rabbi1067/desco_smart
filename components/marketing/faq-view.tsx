"use client";

import { Section, Eyebrow } from "@/components/marketing/section";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { useTranslation } from "@/lib/i18n";

export function FaqView() {
  const { t } = useTranslation();
  return (
    <Section>
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>{t("faq.eyebrow")}</Eyebrow>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {t("faq.title")}
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          {t("faq.subtitle")}
        </p>
      </div>
      <FaqAccordion />
    </Section>
  );
}
