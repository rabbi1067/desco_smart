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
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
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
  const [showAdvanced, setShowAdvanced] = useState(false);
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
      smtpPass: "",
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
      // Ensure host and port default safely even if untouched in advanced accordion
      const payload: SmtpSettingsInput = {
        ...values,
        smtpHost: values.smtpHost?.trim() || "smtp.gmail.com",
        smtpPort: values.smtpPort || 587,
      };

      const result = await saveSmtpSettingsAction(payload);
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
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Mail className="size-5 text-primary" aria-hidden="true" />
                <CardTitle className="text-base">
                  Gmail & Email Alert Gateway
                </CardTitle>
              </div>
              {settings.configured ? (
                <Badge variant="healthy" className="gap-1 font-semibold">
                  <ShieldCheck className="size-3" aria-hidden="true" />
                  Gateway Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 font-semibold">
                  <ShieldAlert className="size-3" aria-hidden="true" />
                  Not Configured
                </Badge>
              )}
            </div>
            <CardDescription>
              Configure instant balance notifications via free Google Gmail App Password or custom SMTP
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Free Gmail Guidance Banner */}
            <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block">100% Free Setup via Gmail:</strong>
                  <span>No paid SMTP server needed. Just enter your Gmail address and 16-character Google App Password.</span>
                </div>
              </div>
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300 hover:underline bg-background/80 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 text-xs"
              >
                <span>Get App Password</span>
                <ExternalLink className="size-3" />
              </a>
            </div>

            <form onSubmit={handleSubmit(onSave)} className="space-y-5" noValidate>
              {/* Primary Simple Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="smtpUser"
                  label="Sender Gmail Address"
                  error={tk(errors.smtpUser?.message)}
                  hint="Your official Gmail address (e.g. name@gmail.com)"
                >
                  <Input
                    id="smtpUser"
                    type="email"
                    placeholder="example@gmail.com"
                    {...register("smtpUser")}
                  />
                </FormField>

                <FormField
                  id="smtpFromName"
                  label={t("admin.email.senderName")}
                  error={tk(errors.smtpFromName?.message)}
                  hint="Brand name displayed in the recipient's inbox"
                >
                  <Input
                    id="smtpFromName"
                    placeholder="DESCO Smart Alert"
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
                    <span>Google App Password (16-digit)</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    100% Free
                  </span>
                </div>
                <div className="relative">
                  <Input
                    id="smtpPass"
                    type={showPassword ? "text" : "password"}
                    placeholder={
                      settings.hasPassword || settings.configured
                        ? "•••••••••••••••• (Saved in system — leave blank to keep)"
                        : "Enter 16-character Google App Password"
                    }
                    className="pr-10 font-mono"
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
                {settings.hasPassword || settings.configured ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium pt-0.5">
                    <ShieldCheck className="size-3.5 shrink-0" />
                    <span>
                      Password saved securely. Leave blank to keep existing password, or enter a new 16-character password to update.
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Generate an App Password at myaccount.google.com &gt; Security &gt; 2-Step Verification &gt; App passwords.
                  </p>
                )}
              </div>

              {/* Advanced SMTP Server Settings Accordion (Host, Port, SSL) */}
              <div className="rounded-xl border border-border/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between p-3.5 bg-muted/30 hover:bg-muted/50 text-left transition-colors text-xs font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Server className="size-3.5 text-muted-foreground" />
                    <span>Advanced / Custom SMTP Server (Host, Port, SSL)</span>
                  </span>
                  {showAdvanced ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </button>

                {showAdvanced && (
                  <div className="p-4 space-y-4 border-t border-border/60 bg-background/50">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <FormField
                          id="smtpHost"
                          label={t("admin.email.host")}
                          error={tk(errors.smtpHost?.message)}
                          hint="Defaults to smtp.gmail.com"
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
                          hint="587 (TLS) or 465 (SSL)"
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

                    <Controller
                      control={control}
                      name="smtpSecure"
                      render={({ field }) => (
                        <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/20">
                          <div className="space-y-0.5">
                            <span className="text-xs font-semibold">
                              SSL / TLS Direct Encryption
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                              Recommended OFF for Port 587 (STARTTLS), ON for Port 465
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
                )}
              </div>

              {/* Service Enabled Switch */}
              <div className="rounded-xl border border-border/80 p-3.5 bg-muted/20">
                <Controller
                  control={control}
                  name="smtpEnabled"
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold">
                          Automated Email Dispatch
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          When enabled, alerts and balance warnings are delivered to user mailboxes
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

              <Button
                type="submit"
                loading={savePending}
                className="w-full sm:w-auto font-semibold shadow-sm"
              >
                Save SMTP Settings
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Test Dispatch and Guide Card */}
      <div className="space-y-6 lg:col-span-5">
        {/* Test Email Dispatch */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="size-5 text-primary" aria-hidden="true" />
              <CardTitle className="text-base">
                Send Test Email
              </CardTitle>
            </div>
            <CardDescription>
              Verify your Gmail configuration by dispatching an instant test email
            </CardDescription>
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
                className="w-full font-semibold"
              >
                <Send className="mr-2 size-4" />
                Dispatch Test Message
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
          </CardContent>
        </Card>

        {/* Step-by-step Setup Guide */}
        <Card className="border-border/60 bg-muted/30 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="size-4 text-primary" />
              <CardTitle className="text-sm font-semibold">
                How to generate a 16-character Google App Password
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <ol className="list-decimal space-y-1.5 pl-4">
              <li>
                Go to{" "}
                <a
                  href="https://myaccount.google.com/security"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  myaccount.google.com &gt; Security
                </a>.
              </li>
              <li>
                Turn on <strong>2-Step Verification</strong> (if not already enabled).
              </li>
              <li>
                In the search box at the top of your Google Account, search for{" "}
                <strong>&quot;App passwords&quot;</strong>.
              </li>
              <li>
                Enter an App name like <strong>DESCO Smart</strong> and click <strong>Create</strong>.
              </li>
              <li>
                Google displays a 16-character password (e.g. <code>abcd efgh ijkl mnop</code>). Copy it and paste it above.
              </li>
            </ol>
            <p className="border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
              🔒 Credentials are encrypted &amp; stored directly in your Supabase database <code>system_settings</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
