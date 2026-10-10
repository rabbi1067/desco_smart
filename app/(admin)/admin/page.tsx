import type { Metadata } from "next";
import { getSystemStats, getAllMeters, getVolumeSeries } from "@/lib/services/admin";
import { AdminOverviewView } from "@/components/admin/admin-overview-view";

export const metadata: Metadata = {
  title: "Executive Control — Control Center",
  description: "Grid operations, fleet telemetry, balance liquidity, and alert status",
};

export default async function AdminOverviewPage() {
  const [stats, meters, volume] = await Promise.all([
    getSystemStats(),
    getAllMeters(),
    getVolumeSeries(14),
  ]);

  return <AdminOverviewView stats={stats} meters={meters} volume={volume} />;
}
