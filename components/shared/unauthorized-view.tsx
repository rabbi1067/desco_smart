"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, Database, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { logoutAction } from "@/app/actions/auth";

/**
 * Shown when an authenticated but non-admin user reaches an admin-only area,
 * or when an account has no database profile row.
 */
export function UnauthorizedView() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const isProfileNotFound = searchParams.get("error") === "profile_not_found";

  if (isProfileNotFound) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <Database className="size-8" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
          User Profile Not Found
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Your account was authenticated, but no database profile could be loaded.
          Please ensure Supabase database migrations (0001_init_schema.sql) have been run in your Supabase SQL Editor.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <form action={logoutAction}>
            <Button variant="default" className="gap-2">
              <LogOut className="size-4" /> Sign Out & Try Again
            </Button>
          </form>
          <Button asChild variant="outline">
            <Link href="/">Go to Home</Link>
          </Button>
        </div>
      </main>
    );
  }

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
