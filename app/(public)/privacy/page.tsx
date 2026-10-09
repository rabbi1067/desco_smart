import type { Metadata } from "next";
import {
  LegalDocument,
  type LegalSection,
} from "@/components/marketing/legal-document";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How DESCO SMART collects, uses, stores and protects your data. An independent tool with database-level Row Level Security and no data sales.",
};

// Single source of truth for this document's revision date.
const LAST_UPDATED = "2026-09-28";

const SECTIONS: LegalSection[] = [
  {
    titleKey: "legal.privacy.collectTitle",
    bodyKey: "legal.privacy.collectBody",
  },
  { titleKey: "legal.privacy.useTitle", bodyKey: "legal.privacy.useBody" },
  {
    titleKey: "legal.privacy.storageTitle",
    bodyKey: "legal.privacy.storageBody",
  },
  {
    titleKey: "legal.privacy.thirdPartyTitle",
    bodyKey: "legal.privacy.thirdPartyBody",
  },
  {
    titleKey: "legal.privacy.rightsTitle",
    bodyKey: "legal.privacy.rightsBody",
  },
  {
    titleKey: "legal.privacy.retentionTitle",
    bodyKey: "legal.privacy.retentionBody",
  },
  {
    titleKey: "legal.privacy.changesTitle",
    bodyKey: "legal.privacy.changesBody",
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrowKey="footer.legal"
      titleKey="legal.privacyTitle"
      introKey="legal.privacyIntro"
      sections={SECTIONS}
      lastUpdatedISO={LAST_UPDATED}
    />
  );
}
