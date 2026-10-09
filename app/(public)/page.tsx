import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/landing-page";

export const metadata: Metadata = {
  title: "DESCO SMART — Prepaid Balance Monitor",
  description:
    "Never get disconnected in the dark. Monitor your DESCO prepaid electricity balance across multiple meters and get automated low-balance alerts before you run out.",
};

// Marketing shell has no user data — safe to serve statically for an hour.
// (Balances are never rendered here; dashboard pages stay dynamic.)
export const revalidate = 3600;

export default function HomePage() {
  return <LandingPage />;
}
