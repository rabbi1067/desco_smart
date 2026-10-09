import type { Metadata } from "next";
import { ForecasterView } from "@/components/marketing/forecaster-view";

export const metadata: Metadata = {
  title: "AI Forecaster",
  description:
    "How DESCO SMART estimates when your prepaid balance will run out — using your own recorded consumption trend, with no fabricated accuracy claims.",
};

export default function AiForecasterPage() {
  return <ForecasterView />;
}
