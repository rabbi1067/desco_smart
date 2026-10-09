"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";
import { registerAction } from "@/app/actions/auth";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

export function RegisterForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  const tk = (msg?: string) => (msg ? t(msg as TranslationKey) : undefined);

  async function onSubmit(values: RegisterInput) {
    setPending(true);
    const result = await registerAction(values);
    setPending(false);

    if (result.success) {
      if (result.data.needsConfirmation) {
        // A session was NOT created — do not pretend the user is signed in.
        setConfirmationSent(true);
        toast.success(t("auth.registerSuccess"));
      } else {
        toast.success(t("auth.registerSuccessNoConfirm"));
        router.replace("/dashboard");
        router.refresh();
      }
      return;
    }

    if (result.fieldErrors) {
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        if (messages[0]) {
          setError(field as keyof RegisterInput, {
            message: t(messages[0] as TranslationKey),
          });
        }
      }
    } else {
      toast.error(t(result.error as TranslationKey));
    }
  }

  // Post-registration confirmation state — honest about what happened: the
  // account exists but the email must be verified before signing in.
  if (confirmationSent) {
    return (
      <AuthCard title={t("auth.checkEmail")}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-7" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("auth.confirmEmailDesc")}
          </p>
          <Button asChild variant="outline" className="mt-2 w-full">
            <Link href="/login">{t("auth.backToLogin")}</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t("auth.register.title")}
      subtitle={t("auth.register.subtitle")}
      footer={
        <span>
          {t("auth.hasAccount")}{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("auth.signIn")}
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          id="fullName"
          label={t("auth.fullName")}
          error={tk(errors.fullName?.message)}
        >
          <Input
            id="fullName"
            type="text"
            autoComplete="name"
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            {...register("fullName")}
          />
        </FormField>

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
          {pending ? t("auth.creatingAccount") : t("auth.createAccount")}
        </Button>
      </form>
    </AuthCard>
  );
}
