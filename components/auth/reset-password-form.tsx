"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";
import { resetPasswordAction } from "@/app/actions/auth";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

export function ResetPasswordForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const tk = (msg?: string) => (msg ? t(msg as TranslationKey) : undefined);

  async function onSubmit(values: ResetPasswordInput) {
    setPending(true);
    const result = await resetPasswordAction(values);
    setPending(false);

    if (result.success) {
      toast.success(t("auth.passwordUpdated"));
      // Session may be a recovery session only; send them through a clean login.
      router.replace("/login");
      router.refresh();
      return;
    }

    if (result.fieldErrors) {
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        if (messages[0]) {
          setError(field as keyof ResetPasswordInput, {
            message: t(messages[0] as TranslationKey),
          });
        }
      }
    } else {
      toast.error(t(result.error as TranslationKey));
    }
  }

  return (
    <AuthCard
      title={t("auth.reset.title")}
      subtitle={t("auth.reset.subtitle")}
      footer={
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("auth.backToLogin")}
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          id="password"
          label={t("auth.newPassword")}
          error={tk(errors.password?.message)}
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
        </FormField>

        <FormField
          id="confirmPassword"
          label={t("auth.confirmPassword")}
          error={tk(errors.confirmPassword?.message)}
        >
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={
              errors.confirmPassword ? "confirmPassword-error" : undefined
            }
            {...register("confirmPassword")}
          />
        </FormField>

        <Button type="submit" className="w-full" loading={pending}>
          {pending ? t("auth.updating") : t("auth.updatePassword")}
        </Button>
      </form>
    </AuthCard>
  );
}
