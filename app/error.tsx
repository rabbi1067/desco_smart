"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Route-segment error boundary.
 *
 * Deliberately provider-FREE (no `useTranslation`, no theme hooks): if a
 * provider itself is what crashed, a boundary that depends on it would throw
 * again and the screen would stay blank. Static bilingual copy keeps this
 * boundary crash-proof. The raw error is logged to the console for
 * developers but never shown to the user — no stack traces or secrets leak
 * into the UI.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        An unexpected error occurred. Please try again. / কোনো সমস্যা হয়েছে।
        আবার চেষ্টা করুন।
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground/70 tabular">
          Error ref: {error.digest}
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={() => reset()}>Try Again</Button>
        <Button asChild variant="outline">
          <Link href="/">Go to home</Link>
        </Button>
      </div>
    </main>
  );
}
