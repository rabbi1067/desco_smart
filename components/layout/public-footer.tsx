"use client";

import Link from "next/link";
import { Facebook, Github, Linkedin, Twitter } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { SOCIAL_LINKS, SOURCE_REPO } from "@/lib/constants";

const QUICK: { href: string; key: TranslationKey }[] = [
  { href: "/about", key: "nav.about" },
  { href: "/features", key: "nav.features" },
  { href: "/faq", key: "nav.faq" },
  { href: "/contact", key: "nav.contact" },
];

const PRODUCT: { href: string; key: TranslationKey }[] = [
  { href: "/ai-forecaster", key: "nav.aiForecaster" },
  { href: "/reviews", key: "nav.reviews" },
  { href: "/login", key: "nav.signIn" },
  { href: "/register", key: "nav.registerMeter" },
];

const LEGAL: { href: string; key: TranslationKey }[] = [
  { href: "/privacy", key: "footer.privacy" },
  { href: "/terms", key: "footer.terms" },
];

const SOCIALS: { href: string; label: string; icon: typeof Github }[] = [
  { href: SOCIAL_LINKS.linkedin, label: "LinkedIn", icon: Linkedin },
  { href: SOCIAL_LINKS.github, label: "GitHub", icon: Github },
  { href: SOCIAL_LINKS.x, label: "X (Twitter)", icon: Twitter },
  { href: SOCIAL_LINKS.facebook, label: "Facebook", icon: Facebook },
];

export function PublicFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border/60 bg-card/30">
      <div className="container mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Logo showTagline />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              {t("footer.description")}
            </p>
            <div className="mt-5 flex items-center gap-2">
              {SOCIALS.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.href}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="grid size-9 place-items-center rounded-lg border border-border/70 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    <Icon className="size-4" />
                  </a>
                );
              })}
            </div>
          </div>

          <FooterColumn title={t("footer.quickLinks")} links={QUICK} t={t} />
          <FooterColumn title={t("footer.product")} links={PRODUCT} t={t} />
          <FooterColumn title={t("footer.legal")} links={LEGAL} t={t} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} DESCO SMART. {t("footer.rights")}
          </p>
          <div className="flex items-center gap-4">
            <a
              href={SOURCE_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              {t("footer.sourceCode")}
            </a>
            <span aria-hidden="true">·</span>
            <span>{t("footer.builtBy")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  t,
}: {
  title: string;
  links: { href: string; key: TranslationKey }[];
  t: (key: TranslationKey) => string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(link.key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
