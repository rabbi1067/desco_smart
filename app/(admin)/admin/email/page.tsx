import type { Metadata } from "next";
import {
  Info,
  Lock,
  Mail,
  Send,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { getEmailGatewayStatus } from "@/lib/services/admin";
import { getServerTranslator } from "@/lib/i18n/server";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Email Gateway",
};

export default async function AdminEmailPage() {
  const gateway = await getEmailGatewayStatus();
  const { t } = await getServerTranslator();

  const rows: { label: string; value: string | null }[] = [
    { label: t("admin.email.host"), value: gateway.host },
    { label: t("admin.email.port"), value: gateway.port },
    { label: t("admin.email.sender"), value: gateway.sender },
    { label: t("admin.email.senderName"), value: gateway.senderName },
    { label: t("admin.email.username"), value: gateway.username },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("admin.email.title")}
        description={t("admin.email.subtitle")}
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Gateway status + non-secret configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Mail className="size-5 text-muted-foreground" aria-hidden="true" />
                <CardTitle className="text-base">
                  {t("admin.email.status")}
                </CardTitle>
              </div>
              {gateway.configured ? (
                <Badge variant="healthy">
                  <ShieldCheck className="size-3" aria-hidden="true" />
                  {t("admin.email.configured")}
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <ShieldAlert className="size-3" aria-hidden="true" />
                  {t("admin.email.notConfigured")}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border/60">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 py-2.5"
                >
                  <dt className="text-sm text-muted-foreground">{row.label}</dt>
                  <dd className="truncate text-sm font-medium tabular">
                    {row.value || "—"}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/50 p-3">
              <Lock
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-xs text-muted-foreground">
                {t("admin.email.secretsNotice")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Test dispatch — reserved for backend integration, never faked */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("admin.email.test")}</CardTitle>
            <CardDescription>{t("admin.email.testDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button disabled className="w-full sm:w-auto">
              <Send className="size-4" aria-hidden="true" />
              {t("admin.email.test")}
            </Button>

            <div className="flex items-start gap-2 rounded-lg border border-info/30 bg-info/5 p-3">
              <Info
                className="mt-0.5 size-4 shrink-0 text-info-foreground"
                aria-hidden="true"
              />
              <p className="text-xs text-muted-foreground">
                {t("admin.email.testNote")}
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
              <Info
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-xs text-muted-foreground">
                {t("admin.email.envNotice")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
