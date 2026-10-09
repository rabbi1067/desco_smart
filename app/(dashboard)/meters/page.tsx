import type { Metadata } from "next";
import { getServerTranslator } from "@/lib/i18n/server";
import { getMeters } from "@/lib/services/meters";
import { PageHeader } from "@/components/shared/page-header";
import { MetersView } from "@/components/meters/meters-view";

export const metadata: Metadata = {
  title: "My Meters",
};

/**
 * Meters listing.
 *
 * Server-fetches the caller's meters (RLS + explicit user_id filter in
 * `getMeters`) and hands them to the interactive client view. No seed/demo
 * data — an account with no meters gets the empty state, never placeholders.
 */
export default async function MetersPage() {
  const { t } = await getServerTranslator();
  const meters = await getMeters();

  return (
    <div className="space-y-8">
      <PageHeader title={t("meters.title")} description={t("meters.subtitle")} />
      <MetersView meters={meters} />
    </div>
  );
}
