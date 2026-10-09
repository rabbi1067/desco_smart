"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { updateAppearanceAction } from "@/app/actions/settings";
import { cn } from "@/lib/utils";
import { LANGUAGES, useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { Language, ThemePreference } from "@/types";

const THEME_OPTIONS: { value: ThemePreference; labelKey: TranslationKey; icon: LucideIcon }[] = [
  { value: "light", labelKey: "settings.themeLight", icon: Sun },
  { value: "dark", labelKey: "settings.themeDark", icon: Moon },
  { value: "system", labelKey: "settings.themeSystem", icon: Monitor },
];

/**
 * Appearance settings. Theme and language apply LIVE (next-themes + the i18n
 * provider) for instant feedback, and are simultaneously persisted to the
 * profile so the choice follows the user to another device. The server action
 * is the source of truth for the toast — we never claim "saved" unless it did.
 */
export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useTranslation();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  // next-themes only knows the real theme after it reads localStorage.
  useEffect(() => setMounted(true), []);

  function persist(next: { theme: ThemePreference; language: Language }) {
    startTransition(async () => {
      const result = await updateAppearanceAction(next);
      if (result.success) toast.success(t("settings.saved"));
      else toast.error(t(result.error as TranslationKey));
    });
  }

  const activeTheme = (mounted ? theme : undefined) as ThemePreference | undefined;

  function handleTheme(value: ThemePreference) {
    setTheme(value);
    persist({ theme: value, language });
  }

  function handleLanguage(value: Language) {
    setLanguage(value);
    persist({ theme: activeTheme ?? "system", language: value });
    // Re-render the server tree so server-rendered strings switch language too.
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Theme */}
      <div className="space-y-2">
        <p className="text-sm font-medium">{t("settings.theme")}</p>
        {mounted ? (
          <div
            role="group"
            aria-label={t("settings.theme")}
            className="flex flex-wrap gap-2"
          >
            {THEME_OPTIONS.map(({ value, labelKey, icon: Icon }) => {
              const active = activeTheme === value;
              return (
                <Button
                  key={value}
                  type="button"
                  variant={active ? "default" : "outline"}
                  aria-pressed={active}
                  disabled={pending}
                  onClick={() => handleTheme(value)}
                  className="gap-2"
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {t(labelKey)}
                </Button>
              );
            })}
          </div>
        ) : (
          <Skeleton className="h-10 w-64" />
        )}
      </div>

      {/* Language */}
      <div className="space-y-2">
        <p className="text-sm font-medium">{t("settings.language")}</p>
        <p className="text-xs text-muted-foreground">
          {t("settings.languageDesc")}
        </p>
        <div
          role="group"
          aria-label={t("settings.language")}
          className={cn("flex flex-wrap gap-2", !mounted && "opacity-70")}
        >
          {LANGUAGES.map((option) => {
            const active = language === option.value;
            return (
              <Button
                key={option.value}
                type="button"
                variant={active ? "default" : "outline"}
                aria-pressed={active}
                disabled={pending}
                onClick={() => handleLanguage(option.value)}
              >
                {option.native}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
