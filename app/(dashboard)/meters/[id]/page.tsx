import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMeterById, getBalanceHistory, getAlerts } from "@/lib/services/meters";
import { getMeterAnalytics } from "@/lib/services/analytics";
import { MeterDetail } from "@/components/meters/meter-detail";

export const metadata: Metadata = {
  title: "Meter Details",
};

export default async function MeterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Ownership is enforced in getMeterById (RLS + explicit user_id filter); a
  // meter that doesn't exist or isn't the caller's returns null → 404.
  const meter = await getMeterById(id);
  if (!meter) notFound();

  // Fetch the detail panels in parallel — all scoped to this user's meter.
  const [readings, alerts, analytics] = await Promise.all([
    getBalanceHistory(id),
    getAlerts(id),
    getMeterAnalytics(id, "7d"),
  ]);

  return (
    <MeterDetail
      meter={meter}
      readings={readings}
      alerts={alerts}
      analytics={analytics}
    />
  );
}
