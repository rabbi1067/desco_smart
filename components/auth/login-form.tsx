"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";
import { loginAction } from "@/app/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

/** Only allow same-origin, single-slash paths — blocks `//evil.com` open redirects. */
function safeRedirect(target: string | null): string {
  if (target && target.startsWith("/") && !target.startsWith("//")) {
    return target;
  }
  return "/dashboard";
}

export function LoginForm() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Zod messages are translation keys; resolve them for display.
  const tk = (msg?: string) => (msg ? t(msg as TranslationKey) : undefined);

  async function onSubmit(values: LoginInput) {
    setPending(true);
    const result = await loginAction(values);
    setPending(false);

    if (result.success) {
      toast.success(t("auth.loginSuccess"));
      const dest = safeRedirect(searchParams.get("redirectTo"));
      window.location.href = dest;
      return;
    }

    // Field-level errors map back onto inputs; otherwise a single toast.
    if (result.fieldErrors) {
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        if (messages[0]) {
          setError(field as keyof LoginInput, {
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
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
      footer={
        <span>
          {t("auth.noAccount")}{" "}
          <Link
            href="/register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("auth.registerNow")}
          </Link>
        </span>
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

        <FormField
          id="password"
          label={t("auth.password")}
          error={tk(errors.password?.message)}
        >
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
        </FormField>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("auth.forgotPassword")}
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={pending}>
          {pending ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
      </form>
    </AuthCard>
  );
}
