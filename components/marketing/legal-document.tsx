"use client";

import { Section, Eyebrow } from "@/components/marketing/section";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

export type LegalSection = {
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
};

/**
 * Shared renderer for the Privacy Policy and Terms of Service pages.
 *
 * All prose lives in the translation dictionaries (English + বাংলা); this
 * component only lays it out. The "last updated" date is passed in from the
 * page so it is a single source of truth per document.
 */
export function LegalDocument({
  eyebrowKey,
  titleKey,
  introKey,
  sections,
  lastUpdatedISO,
}: {
  eyebrowKey: TranslationKey;
  titleKey: TranslationKey;
  introKey: TranslationKey;
  sections: LegalSection[];
  lastUpdatedISO: string;
}) {
  const { t, language } = useTranslation();

  const lastUpdated = new Intl.DateTimeFormat(
    language === "bn" ? "bn-BD" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" },
  ).format(new Date(lastUpdatedISO));

  return (
    <Section>
      <article className="mx-auto max-w-3xl">
        <header className="text-center">
          <Eyebrow>{t(eyebrowKey)}</Eyebrow>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            {t(titleKey)}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("legal.lastUpdated")}: {lastUpdated}
          </p>
        </header>

        <p className="mt-10 text-base leading-relaxed text-muted-foreground">
          {t(introKey)}
        </p>

        <div className="mt-8 space-y-8">
          {sections.map((section, index) => (
            <section key={section.titleKey}>
              <h2 className="text-xl font-semibold tracking-tight">
                <span className="text-primary tabular">{index + 1}.</span>{" "}
                {t(section.titleKey)}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t(section.bodyKey)}
              </p>
            </section>
          ))}
        </div>

        {/* Independence disclaimer required on every legal document. */}
        <p className="mt-12 rounded-lg border border-border/60 bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
          {t("legal.projectNotice")}
        </p>
      </article>
    </Section>
  );
}
