import type { Metadata } from "next";
import { FeaturesView } from "@/components/marketing/features-view";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Multi-meter monitoring, automated balance checks, email alerts, consumption analytics, balance history, and bilingual support — everything DESCO SMART does.",
};

export default function FeaturesPage() {
  return <FeaturesView />;
}
