"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

/**
 * Route-segment error boundary. Renders inside the root layout, so the theme
 * and i18n providers are available. The raw error is logged to the console for
 * developers but never shown to the user — no stack traces or secrets leak into
 * the UI.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    // Developer-facing only. Server-side secrets never reach this client log.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-8" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">
        {t("error.title")}
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {t("error.generic")}
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground/70 tabular">
          {error.digest}
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={() => reset()}>{t("error.tryAgain")}</Button>
        <Button asChild variant="outline">
          <Link href="/">{t("error.goHome")}</Link>
        </Button>
      </div>
    </main>
  );
}
