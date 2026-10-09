import type { Metadata } from "next";
import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerTranslator } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default async function NotFound() {
  const { t } = await getServerTranslator();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <FileQuestion className="size-8" aria-hidden="true" />
      </div>
      <p className="mt-6 text-5xl font-bold tracking-tight text-primary tabular">
        404
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">
        {t("error.notFound")}
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {t("error.notFoundDesc")}
      </p>
      <Button asChild className="mt-8">
        <Link href="/">{t("error.goHome")}</Link>
      </Button>
    </main>
  );
}
