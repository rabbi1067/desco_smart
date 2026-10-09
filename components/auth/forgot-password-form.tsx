"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { forgotPasswordAction } from "@/app/actions/auth";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const tk = (msg?: string) => (msg ? t(msg as TranslationKey) : undefined);

  async function onSubmit(values: ForgotPasswordInput) {
    setPending(true);
    const result = await forgotPasswordAction(values);
    setPending(false);

    if (result.success) {
      // The action deliberately always succeeds (no account enumeration).
      setSent(true);
      return;
    }

    if (result.fieldErrors?.email?.[0]) {
      setError("email", {
        message: t(result.fieldErrors.email[0] as TranslationKey),
      });
    } else {
      toast.error(t(result.error as TranslationKey));
    }
  }

  if (sent) {
    return (
      <AuthCard title={t("auth.checkEmail")}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-7" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">{t("auth.resetSent")}</p>
          <Button asChild variant="outline" className="mt-2 w-full">
            <Link href="/login">{t("auth.backToLogin")}</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t("auth.forgot.title")}
      subtitle={t("auth.forgot.subtitle")}
      footer={
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t("auth.backToLogin")}
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField id="email" label={t("auth.email")} error={tk(errors.email?.message)}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
        </FormField>

        <Button type="submit" className="w-full" loading={pending}>
          {pending ? t("auth.sending") : t("auth.sendResetLink")}
        </Button>
      </form>
    </AuthCard>
  );
}
