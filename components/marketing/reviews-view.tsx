"use client";

import { Search } from "lucide-react";
import { Section, Eyebrow } from "@/components/marketing/section";
import { EmptyState } from "@/components/shared/empty-state";
import { useTranslation } from "@/lib/i18n";

export function ReviewsView() {
  const { t } = useTranslation();
  return (
    <Section>
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>{t("reviews.eyebrow")}</Eyebrow>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {t("reviews.title")}
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          {t("reviews.subtitle")}
        </p>
      </div>
      {/* No reviews table exists and no testimonials are fabricated — this is a
          genuine empty state, ready for a CMS-backed source later. */}
      <div className="mx-auto mt-12 max-w-2xl">
        <EmptyState
          icon={Search}
          title={t("reviews.emptyTitle")}
          description={t("reviews.emptyDesc")}
        />
      </div>
    </Section>
  );
}
