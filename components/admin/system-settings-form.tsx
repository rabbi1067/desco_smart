"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/auth/form-field";
import { updateSystemSettingsAction } from "@/app/actions/settings";
import {
  systemSettingsSchema,
  type SystemSettingsInput,
} from "@/lib/validations";
import {
  ALERT_COOLDOWN_HOURS,
  DEFAULT_CRITICAL_THRESHOLD,
  DEFAULT_LOW_THRESHOLD,
} from "@/lib/constants";
import { LANGUAGES, useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { ThemePreference } from "@/types";

const THEME_OPTIONS: { value: ThemePreference; labelKey: TranslationKey }[] = [
  { value: "light", labelKey: "settings.themeLight" },
  { value: "dark", labelKey: "settings.themeDark" },
  { value: "system", labelKey: "settings.themeSystem" },
];

function toNumber(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Global parameters form (admin only).
 *
 * Current values are read from the persisted `system_settings` map on the server
 * and seeded as defaults. The server action re-checks admin, re-validates with
 * Zod, and enforces critical < low — the same rule is surfaced here as a field
 * error returned from the action, never duplicated as client-only logic.
 */
export function SystemSettingsForm({
  settings,
}: {
  settings: Record<string, string>;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SystemSettingsInput>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      defaultLowThreshold: toNumber(
        settings.default_low_threshold,
        DEFAULT_LOW_THRESHOLD,
      ),
      defaultCriticalThreshold: toNumber(
        settings.default_critical_threshold,
        DEFAULT_CRITICAL_THRESHOLD,
      ),
      alertCooldownHours: toNumber(
        settings.alert_cooldown_hours,
        ALERT_COOLDOWN_HOURS,
      ),
      maintenanceMode: settings.maintenance_mode === "true",
      defaultLanguage: settings.default_language === "bn" ? "bn" : "en",
      defaultTheme:
        settings.default_theme === "light" || settings.default_theme === "system"
          ? settings.default_theme
          : "dark",
    },
  });

  const tk = (msg?: string) => (msg ? t(msg as TranslationKey) : undefined);

  async function onSubmit(values: SystemSettingsInput) {
    setPending(true);
    const result = await updateSystemSettingsAction(values);
    setPending(false);

    if (result.success) {
      toast.success(t("admin.settings.saved"));
      router.refresh();
      return;
    }
    if (result.fieldErrors) {
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        if (messages[0]) {
          setError(field as keyof SystemSettingsInput, {
            message: t(messages[0] as TranslationKey),
          });
        }
      }
    } else {
      toast.error(t(result.error as TranslationKey));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="defaultLowThreshold"
          label={t("admin.settings.defaultLow")}
          error={tk(errors.defaultLowThreshold?.message)}
        >
          <Input
            id="defaultLowThreshold"
            type="number"
            inputMode="numeric"
            min={0}
            aria-invalid={!!errors.defaultLowThreshold}
            {...register("defaultLowThreshold")}
          />
        </FormField>

        <FormField
          id="defaultCriticalThreshold"
          label={t("admin.settings.defaultCritical")}
          error={tk(errors.defaultCriticalThreshold?.message)}
        >
          <Input
            id="defaultCriticalThreshold"
            type="number"
            inputMode="numeric"
            min={0}
            aria-invalid={!!errors.defaultCriticalThreshold}
            {...register("defaultCriticalThreshold")}
          />
        </FormField>
      </div>

      <FormField
        id="alertCooldownHours"
        label={t("admin.settings.cooldown")}
        hint={t("admin.settings.cooldownHint")}
        error={tk(errors.alertCooldownHours?.message)}
      >
        <Input
          id="alertCooldownHours"
          type="number"
          inputMode="numeric"
          min={0}
          max={168}
          aria-invalid={!!errors.alertCooldownHours}
          {...register("alertCooldownHours")}
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="defaultLanguage"
          label={t("admin.settings.defaultLanguage")}
        >
          <Controller
            control={control}
            name="defaultLanguage"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="defaultLanguage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.native}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField id="defaultTheme" label={t("admin.settings.defaultTheme")}>
          <Controller
            control={control}
            name="defaultTheme"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="defaultTheme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THEME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </div>

      <Controller
        control={control}
        name="maintenanceMode"
        render={({ field }) => (
          <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
            <span className="space-y-0.5">
              <span className="block text-sm font-medium">
                {t("admin.settings.maintenance")}
              </span>
              <span className="block text-xs text-muted-foreground">
                {t("admin.settings.maintenanceHint")}
              </span>
            </span>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-label={t("admin.settings.maintenance")}
            />
          </label>
        )}
      />

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          {t("admin.settings.save")}
        </Button>
      </div>
    </form>
  );
}
