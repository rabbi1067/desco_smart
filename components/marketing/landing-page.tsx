"use client";

import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Check,
  Gauge,
  Lock,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  Home as HomeIcon,
  Building2,
  Zap,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Section,
  SectionHeading,
  Eyebrow,
} from "@/components/marketing/section";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { ForecasterCards } from "@/components/marketing/forecaster-cards";
import { EmptyState } from "@/components/shared/empty-state";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

export function LandingPage() {
  const { t } = useTranslation();

  return (
    <>
      <Hero t={t} />
      <HowItWorks t={t} />
      <Section id="features" className="border-t border-border/50">
        <SectionHeading
          eyebrow={t("features.eyebrow")}
          title={t("features.title")}
          subtitle={t("features.subtitle")}
        />
        <FeatureGrid />
      </Section>
      <MultiMeter t={t} />
      <Alerts t={t} />
      <Analytics t={t} />
      <Section id="ai" className="border-t border-border/50">
        <SectionHeading
          eyebrow={t("ai.eyebrow")}
          title={t("ai.title")}
          subtitle={t("ai.subtitle")}
        />
        <ForecasterCards />
      </Section>
      <Security t={t} />
      <Reviews t={t} />
      <Section id="faq" className="border-t border-border/50">
        <SectionHeading
          eyebrow={t("faq.eyebrow")}
          title={t("faq.title")}
          subtitle={t("faq.subtitle")}
        />
        <FaqAccordion />
      </Section>
      <FinalCta t={t} />
    </>
  );
}

type T = (key: TranslationKey, vars?: Record<string, string | number>) => string;

// -----------------------------------------------------------------------------
// Hero
// -----------------------------------------------------------------------------
function Hero({ t }: { t: T }) {
  const points: TranslationKey[] = [
    "hero.point1",
    "hero.point2",
    "hero.point3",
    "hero.point4",
    "hero.point5",
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid mask-fade-b opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="container relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-8 lg:px-8 lg:py-28">
        <div className="animate-fade-up">
          <Eyebrow>{t("hero.badge")}</Eyebrow>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("hero.title1")}{" "}
            <span className="text-primary">{t("hero.title2")}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            {t("hero.subtitle")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register">
                {t("hero.ctaPrimary")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">{t("hero.ctaSecondary")}</Link>
            </Button>
          </div>

          <ul className="mt-8 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm">
                <Check
                  className="size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span className="text-muted-foreground">{t(point)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* How-it-works card. Deliberately shows NO balance — balances are
            private and only visible after sign-in on the dashboard. */}
        <div className="animate-fade-in lg:justify-self-end">
          <Card className="w-full max-w-md border-border/70 bg-card/80 shadow-2xl shadow-primary/5 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/70">
                    <Zap
                      className="size-4 text-primary-foreground"
                      fill="currentColor"
                    />
                  </span>
                  <span className="text-sm font-semibold">
                    {t("hero.previewTitle")}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-primary/5 px-2.5 py-1 text-xs text-muted-foreground">
                  <Lock className="size-3" aria-hidden="true" />
                  {t("hero.previewEmpty")}
                </span>
              </div>

              <ol className="mt-6 space-y-3">
                <li className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <ListChecks className="size-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm">
                    <span className="font-semibold">
                      {t("hero.cardStep1Title")}
                    </span>
                    <span className="mt-0.5 block text-muted-foreground">
                      {t("hero.cardStep1Desc")}
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Gauge className="size-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm">
                    <span className="font-semibold">
                      {t("hero.cardStep2Title")}
                    </span>
                    <span className="mt-0.5 block text-muted-foreground">
                      {t("hero.cardStep2Desc")}
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Mail className="size-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm">
                    <span className="font-semibold">
                      {t("hero.cardStep3Title")}
                    </span>
                    <span className="mt-0.5 block text-muted-foreground">
                      {t("hero.cardStep3Desc")}
                    </span>
                  </span>
                </li>
              </ol>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                {t("hero.previewHint")}
              </p>

              <Button asChild className="mt-4 w-full">
                <Link href="/register">
                  {t("hero.previewCta")}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// How it works
// -----------------------------------------------------------------------------
function HowItWorks({ t }: { t: T }) {
  const steps: {
    icon: LucideIcon;
    titleKey: TranslationKey;
    descKey: TranslationKey;
  }[] = [
    { icon: ShieldCheck, titleKey: "how.step1.title", descKey: "how.step1.desc" },
    { icon: Gauge, titleKey: "how.step2.title", descKey: "how.step2.desc" },
    { icon: BellRing, titleKey: "how.step3.title", descKey: "how.step3.desc" },
    { icon: Mail, titleKey: "how.step4.title", descKey: "how.step4.desc" },
  ];

  return (
    <Section className="border-t border-border/50 bg-card/20">
      <SectionHeading
        eyebrow={t("how.eyebrow")}
        title={t("how.title")}
        subtitle={t("how.subtitle")}
      />
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.titleKey} className="relative">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold">
                {t(step.titleKey)}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(step.descKey)}
              </p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// -----------------------------------------------------------------------------
// Multi-meter (illustrative only)
// -----------------------------------------------------------------------------
function MultiMeter({ t }: { t: T }) {
  const cards: { icon: LucideIcon; labelKey: TranslationKey }[] = [
    { icon: HomeIcon, labelKey: "multi.home" },
    { icon: Building2, labelKey: "multi.office" },
    { icon: Store, labelKey: "multi.shop" },
  ];
  const points: TranslationKey[] = [
    "multi.point1",
    "multi.point2",
    "multi.point3",
  ];

  return (
    <Section className="border-t border-border/50">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <Eyebrow>{t("multi.eyebrow")}</Eyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("multi.title")}
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {t("multi.subtitle")}
          </p>
          <ul className="mt-6 space-y-3">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <Check
                  className="mt-0.5 size-5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span className="text-sm text-muted-foreground">
                  {t(point)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.labelKey} className="border-border/60">
                <CardContent className="flex items-center gap-4 p-4">
                  <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{t(card.labelKey)}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("multi.illustrative")}
                    </p>
                  </div>
                  <span
                    className="text-lg font-bold text-muted-foreground/30"
                    aria-hidden="true"
                  >
                    ৳ —
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

// -----------------------------------------------------------------------------
// Alerts
// -----------------------------------------------------------------------------
function Alerts({ t }: { t: T }) {
  const steps: TranslationKey[] = [
    "alertsec.step1",
    "alertsec.step2",
    "alertsec.step3",
    "alertsec.step4",
  ];

  return (
    <Section className="border-t border-border/50 bg-card/20">
      <SectionHeading
        eyebrow={t("alertsec.eyebrow")}
        title={t("alertsec.title")}
        subtitle={t("alertsec.subtitle")}
      />
      <div className="mx-auto mt-14 max-w-4xl">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step}
              className="rounded-xl border border-border/60 bg-background/60 p-5"
            >
              <span className="text-sm font-bold text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-2 text-sm text-muted-foreground">{t(step)}</p>
            </div>
          ))}
        </div>

        <Card className="mt-6 border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-4 p-6">
            <RefreshCw
              className="mt-0.5 size-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div>
              <h3 className="text-base font-semibold">
                {t("alertsec.dedupeTitle")}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t("alertsec.dedupeDesc")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}

// -----------------------------------------------------------------------------
// Analytics (abstract visual, no fabricated numbers)
// -----------------------------------------------------------------------------
function Analytics({ t }: { t: T }) {
  const items: TranslationKey[] = [
    "analyticsec.item1",
    "analyticsec.item2",
    "analyticsec.item3",
    "analyticsec.item4",
  ];
  // Decorative bar heights only — no axis, no values, clearly not real data.
  const bars = [45, 62, 38, 74, 55, 82, 48, 68, 90, 58, 76, 64];

  return (
    <Section className="border-t border-border/50">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="order-2 lg:order-1">
          <Card className="overflow-hidden border-border/60">
            <CardContent className="p-6">
              <div
                className="flex h-56 items-end gap-2"
                aria-hidden="true"
                role="presentation"
              >
                {bars.map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t bg-gradient-to-t from-primary/30 to-primary"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                {t("analyticsec.illustrative")}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="order-1 lg:order-2">
          <Eyebrow>{t("analyticsec.eyebrow")}</Eyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("analyticsec.title")}
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {t("analyticsec.subtitle")}
          </p>
          <ul className="mt-6 space-y-3">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check
                  className="mt-0.5 size-5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span className="text-sm text-muted-foreground">{t(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

// -----------------------------------------------------------------------------
// Security
// -----------------------------------------------------------------------------
function Security({ t }: { t: T }) {
  const items: { titleKey: TranslationKey; descKey: TranslationKey }[] = [
    { titleKey: "security.item1.title", descKey: "security.item1.desc" },
    { titleKey: "security.item2.title", descKey: "security.item2.desc" },
    { titleKey: "security.item3.title", descKey: "security.item3.desc" },
    { titleKey: "security.item4.title", descKey: "security.item4.desc" },
    { titleKey: "security.item5.title", descKey: "security.item5.desc" },
    { titleKey: "security.item6.title", descKey: "security.item6.desc" },
  ];

  return (
    <Section className="border-t border-border/50 bg-card/20">
      <SectionHeading
        eyebrow={t("security.eyebrow")}
        title={t("security.title")}
        subtitle={t("security.subtitle")}
      />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.titleKey}
            className="rounded-xl border border-border/60 bg-background/60 p-6"
          >
            <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Lock className="size-5" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-base font-semibold">{t(item.titleKey)}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(item.descKey)}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// -----------------------------------------------------------------------------
// Reviews — genuinely empty (no reviews table / no fabricated testimonials)
// -----------------------------------------------------------------------------
function Reviews({ t }: { t: T }) {
  return (
    <Section id="reviews" className="border-t border-border/50">
      <SectionHeading
        eyebrow={t("reviews.eyebrow")}
        title={t("reviews.title")}
        subtitle={t("reviews.subtitle")}
      />
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

// -----------------------------------------------------------------------------
// Final CTA
// -----------------------------------------------------------------------------
function FinalCta({ t }: { t: T }) {
  return (
    <Section className="border-t border-border/50">
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card px-6 py-16 text-center sm:px-12">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("cta.title")}
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {t("cta.subtitle")}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register">
                {t("hero.ctaPrimary")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/features">{t("common.learnMore")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
