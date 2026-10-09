import type { Metadata } from "next";
import { AboutView } from "@/components/marketing/about-view";

export const metadata: Metadata = {
  title: "About",
  description:
    "DESCO SMART is an independent, open-source tool that monitors DESCO prepaid electricity balances and sends automated low-balance alerts.",
};

export default function AboutPage() {
  return <AboutView />;
}
