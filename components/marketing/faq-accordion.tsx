"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

const FAQS: { q: TranslationKey; a: TranslationKey }[] = [
  { q: "faq.q1", a: "faq.a1" },
  { q: "faq.q2", a: "faq.a2" },
  { q: "faq.q3", a: "faq.a3" },
  { q: "faq.q4", a: "faq.a4" },
  { q: "faq.q5", a: "faq.a5" },
  { q: "faq.q6", a: "faq.a6" },
  { q: "faq.q7", a: "faq.a7" },
  { q: "faq.q8", a: "faq.a8" },
];

export function FaqAccordion() {
  const { t } = useTranslation();

  return (
    <Accordion
      type="single"
      collapsible
      className="mx-auto mt-12 w-full max-w-3xl"
    >
      {FAQS.map((faq, index) => (
        <AccordionItem key={faq.q} value={`item-${index}`}>
          <AccordionTrigger className="text-left text-base font-medium">
            {t(faq.q)}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            {t(faq.a)}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
