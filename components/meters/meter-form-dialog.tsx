"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/auth/form-field";
import { createMeterAction, updateMeterAction } from "@/app/actions/meters";
import { createMeterSchema, type CreateMeterInput } from "@/lib/validations";
import {
  DEFAULT_LOW_THRESHOLD,
  DEFAULT_CRITICAL_THRESHOLD,
} from "@/lib/constants";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { Meter } from "@/types";

/**
 * Add / edit meter dialog.
 *
 * One component serves both modes. In edit mode the meter number/account fields
 * are still editable (a meter can be re-pointed), but the DESCO verification in
 * `createMeterAction` only runs on create — edits go through `updateMeterAction`
 * which recomputes status without re-hitting DESCO.
 *
 * The dialog is controlled by the parent so the trigger can live anywhere
 * (page header for "add", card menu for "edit").
 */
export function MeterFormDialog({
  open,
  onOpenChange,
  meter,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present → edit mode; absent → create mode. */
  meter?: Meter;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const isEdit = Boolean(meter);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateMeterInput>({
    resolver: zodResolver(createMeterSchema),
    defaultValues: {
      name: "",
      meterNumber: "",
      accountNumber: "",
      threshold: DEFAULT_LOW_THRESHOLD,
      criticalThreshold: DEFAULT_CRITICAL_THRESHOLD,
      monitoringEnabled: true,
      emailAlertEnabled: true,
    },
  });

  // Re-seed the form whenever the dialog opens, so "edit" shows the meter's
  // current values and "add" always starts clean.
  useEffect(() => {
    if (!open) return;
    reset(
      meter
        ? {
            name: meter.name,
            meterNumber: meter.meter_number,
            accountNumber: meter.account_number,
            threshold: meter.threshold,
            criticalThreshold: meter.critical_threshold,
            monitoringEnabled: meter.monitoring_enabled,
            emailAlertEnabled: meter.email_alert_enabled,
          }
        : {
            name: "",
            meterNumber: "",
            accountNumber: "",
            threshold: DEFAULT_LOW_THRESHOLD,
            criticalThreshold: DEFAULT_CRITICAL_THRESHOLD,
            monitoringEnabled: true,
            emailAlertEnabled: true,
          },
    );
  }, [open, meter, reset]);

  const tk = (msg?: string) => (msg ? t(msg as TranslationKey) : undefined);

  async function onSubmit(values: CreateMeterInput) {
    setPending(true);
    const result = meter
      ? await updateMeterAction({ ...values, id: meter.id })
      : await createMeterAction(values);
    setPending(false);

    if (result.success) {
      toast.success(t(result.message as TranslationKey));
      onOpenChange(false);
      router.refresh();
      return;
    }

    if (result.fieldErrors) {
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        if (messages[0] && field in values) {
          setError(field as keyof CreateMeterInput, {
            message: t(messages[0] as TranslationKey),
          });
        }
      }
      // A field error with no matching field (e.g. verification) still needs to
      // surface, so show the top-level error as a toast too.
      if (!Object.keys(result.fieldErrors).some((f) => f in values)) {
        toast.error(t(result.error as TranslationKey));
      }
    } else {
      toast.error(t(result.error as TranslationKey));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("meterForm.editTitle") : t("meterForm.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("meterForm.editDesc") : t("meterForm.addDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            id="name"
            label={t("meterForm.name")}
            error={tk(errors.name?.message)}
            hint={t("meterForm.nameHint")}
          >
            <Input
              id="name"
              placeholder={t("meterForm.namePlaceholder")}
              aria-invalid={!!errors.name}
              {...register("name")}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="meterNumber"
              label={t("meterForm.meterNumber")}
              error={tk(errors.meterNumber?.message)}
            >
              <Input
                id="meterNumber"
                inputMode="numeric"
                placeholder={t("meterForm.meterNumberPlaceholder")}
                aria-invalid={!!errors.meterNumber}
                {...register("meterNumber")}
              />
            </FormField>

            <FormField
              id="accountNumber"
              label={t("meterForm.accountNumber")}
              error={tk(errors.accountNumber?.message)}
            >
              <Input
                id="accountNumber"
                inputMode="numeric"
                placeholder={t("meterForm.accountNumberPlaceholder")}
                aria-invalid={!!errors.accountNumber}
                {...register("accountNumber")}
              />
            </FormField>
          </div>

          <p className="text-xs text-muted-foreground">
            {isEdit ? t("meterForm.numbersHint") : t("meterForm.verifyHint")}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="threshold"
              label={t("meterForm.threshold")}
              error={tk(errors.threshold?.message)}
              hint={t("meterForm.thresholdHint")}
            >
              <Input
                id="threshold"
                type="number"
                inputMode="numeric"
                min={0}
                aria-invalid={!!errors.threshold}
                {...register("threshold")}
              />
            </FormField>

            <FormField
              id="criticalThreshold"
              label={t("meterForm.criticalThreshold")}
              error={tk(errors.criticalThreshold?.message)}
              hint={t("meterForm.criticalHint")}
            >
              <Input
                id="criticalThreshold"
                type="number"
                inputMode="numeric"
                min={0}
                aria-invalid={!!errors.criticalThreshold}
                {...register("criticalThreshold")}
              />
            </FormField>
          </div>

          <Controller
            control={control}
            name="monitoringEnabled"
            render={({ field }) => (
              <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                <span className="space-y-0.5">
                  <span className="block text-sm font-medium">
                    {t("meterForm.monitoringEnabled")}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {t("meterForm.monitoringHint")}
                  </span>
                </span>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label={t("meterForm.monitoringEnabled")}
                />
              </label>
            )}
          />

          <Controller
            control={control}
            name="emailAlertEnabled"
            render={({ field }) => (
              <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                <span className="space-y-0.5">
                  <span className="block text-sm font-medium">
                    {t("meterForm.emailAlertEnabled")}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {t("meterForm.emailHint")}
                  </span>
                </span>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label={t("meterForm.emailAlertEnabled")}
                />
              </label>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {t("meterForm.cancel")}
            </Button>
            <Button type="submit" loading={pending}>
              {isEdit
                ? pending
                  ? t("meterForm.saving")
                  : t("meterForm.save")
                : pending
                  ? t("meterForm.submitting")
                  : t("meterForm.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
