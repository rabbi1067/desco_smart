import type { Metadata } from "next";
import { ContactView } from "@/components/marketing/contact-view";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the developer of DESCO SMART, report an issue on the open-source repository, or find official DESCO customer-support channels.",
};

export default function ContactPage() {
  return <ContactView />;
}
