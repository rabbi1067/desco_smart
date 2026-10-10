"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Mail,
  Send,
  Server,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormField } from "@/components/auth/form-field";
import {
  saveSmtpSettingsAction,
  testSmtpConnectionAction,
} from "@/app/actions/settings";
import {
  smtpSettingsSchema,
  testEmailSchema,
  type SmtpSettingsInput,
  type TestEmailInput,
} from "@/lib/validations";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { SmtpSettings } from "@/types";

export function AdminEmailForm({
  settings,
  adminEmail,
}: {
  settings: SmtpSettings;
  adminEmail: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [savePending, startSaveTransition] = useTransition();
  const [testPending, startTestTransition] = useTransition();
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SmtpSettingsInput>({
    resolver: zodResolver(smtpSettingsSchema),
    defaultValues: {
      smtpHost: settings.host || "smtp.gmail.com",
      smtpPort: settings.port || 587,
      smtpUser: settings.user || "",
      smtpPass: settings.pass || "",
      smtpFromName: settings.fromName || "DESCO Smart Alert",
      smtpSecure: settings.secure ?? false,
      smtpEnabled: settings.enabled ?? true,
    },
  });

  const {
    register: registerTest,
    handleSubmit: handleTestSubmit,
    formState: { errors: testErrors },
  } = useForm<TestEmailInput>({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      targetEmail: adminEmail || settings.user || "",
    },
  });

  const tk = (msg?: string) => (msg ? t(msg as TranslationKey) : undefined);

  function onSave(values: SmtpSettingsInput) {
    startSaveTransition(async () => {
      const result = await saveSmtpSettingsAction(values);
      if (result.success) {
        toast.success(t("admin.email.settingsSaved"));
        router.refresh();
      } else {
        toast.error(t((result.error as TranslationKey) || "error.generic"));
      }
    });
  }

  function onTest(values: TestEmailInput) {
    setTestResult(null);
    startTestTransition(async () => {
      const result = await testSmtpConnectionAction(values);
      if (result.success) {
        setTestResult({
          success: true,
          message: result.data?.message || t("admin.email.testSentSuccess"),
        });
        toast.success(t("admin.email.testSentSuccess"));
      } else {
        setTestResult({
          success: false,
          message: result.error || "Failed to dispatch test email",
        });
        toast.error(result.error || t("admin.email.testFailed"));
      }
    });
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-12">
      {/* Main SMTP Settings Form */}
      <div className="space-y-6 lg:col-span-7">
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Server className="size-5 text-primary" aria-hidden="true" />
                <CardTitle className="text-base">
                  {t("admin.email.title")}
                </CardTitle>
              </div>
              {settings.configured ? (
                <Badge variant="healthy" className="gap-1">
                  <ShieldCheck className="size-3" aria-hidden="true" />
                  {t("admin.email.configured")}
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <ShieldAlert className="size-3" aria-hidden="true" />
                  {t("admin.email.notConfigured")}
                </Badge>
              )}
            </div>
            <CardDescription>{t("admin.email.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSave)} className="space-y-5" noValidate>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <FormField
                    id="smtpHost"
                    label={t("admin.email.host")}
                    error={tk(errors.smtpHost?.message)}
                  >
                    <Input
                      id="smtpHost"
                      placeholder="smtp.gmail.com"
                      {...register("smtpHost")}
                    />
                  </FormField>
                </div>
                <div>
                  <FormField
                    id="smtpPort"
                    label={t("admin.email.port")}
                    error={tk(errors.smtpPort?.message)}
                  >
                    <Input
                      id="smtpPort"
                      type="number"
                      placeholder="587"
                      {...register("smtpPort")}
                    />
                  </FormField>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="smtpUser"
                  label={t("admin.email.sender")}
                  error={tk(errors.smtpUser?.message)}
                  hint="Your official Gmail or SMTP mailbox"
                >
                  <Input
                    id="smtpUser"
                    type="email"
                    placeholder="desco.alert@gmail.com"
                    {...register("smtpUser")}
                  />
                </FormField>

                <FormField
                  id="smtpFromName"
                  label={t("admin.email.senderName")}
                  error={tk(errors.smtpFromName?.message)}
                >
                  <Input
                    id="smtpFromName"
                    placeholder="DESCO Smart Balance Alert"
                    {...register("smtpFromName")}
                  />
                </FormField>
              </div>

              {/* Password / App Password with Eye toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="smtpPass"
                    className="flex items-center gap-1.5 text-sm font-medium"
                  >
                    <KeyRound className="size-4 text-primary" />
                    <span>{t("admin.email.appPassword")}</span>
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Google App Password
                  </span>
                </div>
                <div className="relative">
                  <Input
                    id="smtpPass"
                    type={showPassword ? "text" : "password"}
                    placeholder="16-character app password (e.g. abcd efgh ijkl mnop)"
                    className="pr-10"
                    {...register("smtpPass")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {errors.smtpPass?.message && (
                  <p className="text-xs text-destructive">
                    {tk(errors.smtpPass.message)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t("admin.email.appPasswordHint")}
                </p>
              </div>

              {/* Switches */}
              <div className="space-y-3 rounded-lg border border-border p-4">
                <Controller
                  control={control}
                  name="smtpSecure"
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium">
                          {t("admin.email.secureSsl")}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          Recommended ON for Port 465, OFF for Port 587 (STARTTLS)
                        </span>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  )}
                />

                <div className="border-t border-border/50 pt-3">
                  <Controller
                    control={control}
                    name="smtpEnabled"
                    render={({ field }) => (
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-sm font-medium">
                            {t("admin.email.serviceEnabled")}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            When disabled, alerts are recorded in-app but emails are paused
                          </span>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    )}
                  />
                </div>
              </div>

              <Button
                type="submit"
                loading={savePending}
                className="w-full sm:w-auto"
              >
                {t("admin.email.saveBtn")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Test Dispatch and Guide Card */}
      <div className="space-y-6 lg:col-span-5">
        {/* Test Email Dispatch */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="size-5 text-primary" aria-hidden="true" />
              <CardTitle className="text-base">
                {t("admin.email.test")}
              </CardTitle>
            </div>
            <CardDescription>{t("admin.email.testDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleTestSubmit(onTest)} className="space-y-3">
              <FormField
                id="targetEmail"
                label={t("admin.email.recipientEmail")}
                error={tk(testErrors.targetEmail?.message)}
              >
                <Input
                  id="targetEmail"
                  type="email"
                  placeholder="recipient@example.com"
                  {...registerTest("targetEmail")}
                />
              </FormField>

              <Button
                type="submit"
                variant="secondary"
                loading={testPending}
                className="w-full"
              >
                <Send className="mr-2 size-4" />
                {t("admin.email.test")}
              </Button>
            </form>

            {testResult && (
              <div
                className={`rounded-lg border p-3 text-xs leading-relaxed ${
                  testResult.success
                    ? "border-healthy/40 bg-healthy/10 text-healthy-foreground"
                    : "border-destructive/40 bg-destructive/10 text-destructive-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  {testResult.success ? (
                    <CheckCircle2 className="size-4 text-healthy" />
                  ) : (
                    <ShieldAlert className="size-4 text-destructive" />
                  )}
                  <span>
                    {testResult.success
                      ? t("admin.email.testSuccess")
                      : t("admin.email.testFailed")}
                  </span>
                </div>
                <p className="mt-1 break-words">{testResult.message}</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {t("admin.email.testNote")}
            </p>
          </CardContent>
        </Card>

        {/* Step-by-step Setup Guide */}
        <Card className="border-border/60 bg-muted/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">
                How to get a Google App Password
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <ol className="list-decimal space-y-1 pl-4">
              <li>
                Open your <strong>Google Account</strong> and visit the{" "}
                <strong>Security</strong> tab.
              </li>
              <li>
                Ensure <strong>2-Step Verification</strong> is turned ON.
              </li>
              <li>
                Under 2-Step Verification, scroll to <strong>App passwords</strong>.
              </li>
              <li>
                Type a name (e.g. <code>DESCO Smart</code>) and click{" "}
                <strong>Create</strong>.
              </li>
              <li>
                Copy the 16-character generated password (without spaces) and paste it
                above.
              </li>
            </ol>
            <p className="border-t border-border/50 pt-2 text-[11px]">
              🔒 Saved securely in your database <code>system_settings</code> and used
              instantly by both the UI and background workers.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
