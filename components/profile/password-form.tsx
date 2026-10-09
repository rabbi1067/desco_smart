"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";
import { changePasswordAction } from "@/app/actions/settings";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validations";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

/**
 * Password change. The server re-authenticates with the current password before
 * updating (a wrong current password comes back as a field error), so this can
 * never change a password from a hijacked but un-reauthenticated session.
 */
export function PasswordForm() {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  });

  const tk = (msg?: string) => (msg ? t(msg as TranslationKey) : undefined);

  async function onSubmit(values: ChangePasswordInput) {
    setPending(true);
    const result = await changePasswordAction(values);
    setPending(false);

    if (result.success) {
      toast.success(t("auth.passwordUpdated"));
      reset();
      return;
    }
    if (result.fieldErrors) {
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        if (messages[0]) {
          setError(field as keyof ChangePasswordInput, {
            message: t(messages[0] as TranslationKey),
          });
        }
      }
    } else {
      toast.error(t(result.error as TranslationKey));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField
        id="currentPassword"
        label={t("profile.currentPassword")}
        error={tk(errors.currentPassword?.message)}
      >
        <PasswordInput
          id="currentPassword"
          autoComplete="current-password"
          aria-invalid={!!errors.currentPassword}
          {...register("currentPassword")}
        />
      </FormField>

      <FormField
        id="new-password"
        label={t("auth.newPassword")}
        error={tk(errors.password?.message)}
      >
        <PasswordInput
          id="new-password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
      </FormField>

      <FormField
        id="confirm-password"
        label={t("auth.confirmPassword")}
        error={tk(errors.confirmPassword?.message)}
      >
        <PasswordInput
          id="confirm-password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
      </FormField>

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          {t("profile.changePassword")}
        </Button>
      </div>
    </form>
  );
}
