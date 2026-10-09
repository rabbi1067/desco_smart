"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { updateNotificationPreferencesAction } from "@/app/actions/settings";
import {
  notificationPreferencesSchema,
  type NotificationPreferencesInput,
} from "@/lib/validations";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { NotificationPreferences } from "@/types";

interface ToggleConfig {
  name: keyof NotificationPreferencesInput;
  labelKey: TranslationKey;
  descKey: TranslationKey;
}

// The email master switch is separated from the per-type toggles: when it is
// off no email is sent regardless of the others, which the copy makes explicit.
const MASTER: ToggleConfig = {
  name: "emailAlerts",
  labelKey: "settings.emailAlerts",
  descKey: "settings.emailAlertsDesc",
};

const ALERT_TOGGLES: ToggleConfig[] = [
  {
    name: "lowBalance",
    labelKey: "settings.lowBalanceAlerts",
    descKey: "settings.lowBalanceAlertsDesc",
  },
  {
    name: "criticalBalance",
    labelKey: "settings.criticalAlerts",
    descKey: "settings.criticalAlertsDesc",
  },
  {
    name: "recoveryAlerts",
    labelKey: "settings.recoveryAlerts",
    descKey: "settings.recoveryAlertsDesc",
  },
  {
    name: "dailySummary",
    labelKey: "settings.dailySummary",
    descKey: "settings.dailySummaryDesc",
  },
];

/**
 * Notification preferences. When no preferences row exists yet the user opts
 * in by default (all channels on) — the server upserts on save. The per-type
 * toggles are visually subordinate to, but not disabled by, the email master
 * switch: the worker enforces the master gate, so the UI need not duplicate it.
 */
export function NotificationSettings({
  preferences,
}: {
  preferences: NotificationPreferences | null;
}) {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);

  const { control, handleSubmit } = useForm<NotificationPreferencesInput>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      emailAlerts: preferences?.email_alerts ?? true,
      lowBalance: preferences?.low_balance ?? true,
      criticalBalance: preferences?.critical_balance ?? true,
      recoveryAlerts: preferences?.recovery_alerts ?? true,
      dailySummary: preferences?.daily_summary ?? true,
    },
  });

  async function onSubmit(values: NotificationPreferencesInput) {
    setPending(true);
    const result = await updateNotificationPreferencesAction(values);
    setPending(false);

    if (result.success) toast.success(t("settings.saved"));
    else toast.error(t(result.error as TranslationKey));
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <ToggleRow control={control} config={MASTER} />

      <div className="space-y-3 sm:pl-4">
        {ALERT_TOGGLES.map((config) => (
          <ToggleRow key={config.name} control={control} config={config} />
        ))}
      </div>

      <p className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{t("settings.scheduleNote")}</span>
      </p>

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}

function ToggleRow({
  control,
  config,
}: {
  control: import("react-hook-form").Control<NotificationPreferencesInput>;
  config: ToggleConfig;
}) {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name={config.name}
      render={({ field }) => (
        <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
          <span className="space-y-0.5">
            <span className="block text-sm font-medium">
              {t(config.labelKey)}
            </span>
            <span className="block text-xs text-muted-foreground">
              {t(config.descKey)}
            </span>
          </span>
          <Switch
            checked={field.value}
            onCheckedChange={field.onChange}
            aria-label={t(config.labelKey)}
          />
        </label>
      )}
    />
  );
}
