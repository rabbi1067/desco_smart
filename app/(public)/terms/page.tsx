import type { Metadata } from "next";
import {
  LegalDocument,
  type LegalSection,
} from "@/components/marketing/legal-document";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms governing use of DESCO SMART, an independent prepaid balance monitoring tool not affiliated with DESCO.",
};

// Single source of truth for this document's revision date.
const LAST_UPDATED = "2026-09-28";

const SECTIONS: LegalSection[] = [
  { titleKey: "legal.terms.acceptTitle", bodyKey: "legal.terms.acceptBody" },
  {
    titleKey: "legal.terms.serviceTitle",
    bodyKey: "legal.terms.serviceBody",
  },
  {
    titleKey: "legal.terms.accountTitle",
    bodyKey: "legal.terms.accountBody",
  },
  { titleKey: "legal.terms.useTitle", bodyKey: "legal.terms.useBody" },
  {
    titleKey: "legal.terms.accuracyTitle",
    bodyKey: "legal.terms.accuracyBody",
  },
  {
    titleKey: "legal.terms.liabilityTitle",
    bodyKey: "legal.terms.liabilityBody",
  },
  {
    titleKey: "legal.terms.thirdPartyTitle",
    bodyKey: "legal.terms.thirdPartyBody",
  },
  {
    titleKey: "legal.terms.changesTitle",
    bodyKey: "legal.terms.changesBody",
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrowKey="footer.legal"
      titleKey="legal.termsTitle"
      introKey="legal.termsIntro"
      sections={SECTIONS}
      lastUpdatedISO={LAST_UPDATED}
    />
  );
}
