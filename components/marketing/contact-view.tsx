"use client";

import {
  ExternalLink,
  Facebook,
  Github,
  Info,
  Linkedin,
  Twitter,
  type LucideIcon,
} from "lucide-react";
import { Section, Eyebrow } from "@/components/marketing/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { SOCIAL_LINKS, SOURCE_REPO } from "@/lib/constants";

const SOCIALS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: SOCIAL_LINKS.linkedin, label: "LinkedIn", icon: Linkedin },
  { href: SOCIAL_LINKS.github, label: "GitHub", icon: Github },
  { href: SOCIAL_LINKS.x, label: "X (Twitter)", icon: Twitter },
  { href: SOCIAL_LINKS.facebook, label: "Facebook", icon: Facebook },
];

export function ContactView() {
  const { t } = useTranslation();

  return (
    <Section>
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>{t("nav.contact")}</Eyebrow>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {t("contact.title")}
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          {t("contact.subtitle")}
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-3xl gap-5">
        {/* Developer + connect */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("contact.developerTitle")}
            </p>
            <h2 className="mt-1 text-xl font-bold">Md. Fazley Rabbi</h2>
            <p className="text-sm text-muted-foreground">
              {t("contact.developerRole")}
            </p>

            <p className="mt-5 text-sm text-muted-foreground">
              {t("contact.connectDesc")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SOCIALS.map((s) => {
                const Icon = s.icon;
                return (
                  <Button key={s.href} asChild variant="outline" size="sm">
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                    >
                      <Icon className="size-4" />
                      {s.label}
                    </a>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Report an issue */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">{t("contact.issueTitle")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("contact.issueDesc")}
            </p>
            <Button asChild variant="outline" className="mt-4">
              <a href={SOURCE_REPO} target="_blank" rel="noopener noreferrer">
                {t("contact.openRepo")}
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* DESCO disclaimer */}
        <Card className="border-border/60 bg-muted/30">
          <CardContent className="flex items-start gap-4 p-6">
            <Info
              className="mt-0.5 size-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-base font-semibold">
                {t("contact.descoTitle")}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t("contact.descoDesc")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}
