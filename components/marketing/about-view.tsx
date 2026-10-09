"use client";

import { ExternalLink } from "lucide-react";
import { Section, Eyebrow } from "@/components/marketing/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { SOURCE_REPO } from "@/lib/constants";

export function AboutView() {
  const { t } = useTranslation();

  const blocks: { titleKey: TranslationKey; bodyKey: TranslationKey }[] = [
    { titleKey: "about.missionTitle", bodyKey: "about.missionBody" },
    { titleKey: "about.originTitle", bodyKey: "about.originBody" },
    { titleKey: "about.stackTitle", bodyKey: "about.stackBody" },
  ];

  return (
    <Section>
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>{t("nav.about")}</Eyebrow>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {t("about.title")}
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          {t("about.subtitle")}
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-3xl gap-5">
        {blocks.map((block) => (
          <Card key={block.titleKey} className="border-border/60">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">{t(block.titleKey)}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t(block.bodyKey)}
              </p>
            </CardContent>
          </Card>
        ))}

        <div className="text-center">
          <Button asChild variant="outline">
            <a href={SOURCE_REPO} target="_blank" rel="noopener noreferrer">
              {t("about.openSource")}
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </Section>
  );
}
