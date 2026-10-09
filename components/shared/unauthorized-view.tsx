"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

/**
 * Shown when an authenticated but non-admin user reaches an admin-only area.
 * `requireAdmin()` in server code redirects here; this page never itself grants
 * or checks access — it is only the friendly wall.
 */
export function UnauthorizedView() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <ShieldAlert className="size-8" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
        {t("error.unauthorized")}
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {t("error.unauthorizedDesc")}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/dashboard">{t("error.goDashboard")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">{t("error.goHome")}</Link>
        </Button>
      </div>
    </main>
  );
}
