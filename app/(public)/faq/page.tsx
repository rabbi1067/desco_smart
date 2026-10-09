import type { Metadata } from "next";
import { FaqView } from "@/components/marketing/faq-view";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about DESCO SMART — how balance monitoring works, how alerts are sent, data privacy, and multi-meter support.",
};

export default function FaqPage() {
  return <FaqView />;
}
