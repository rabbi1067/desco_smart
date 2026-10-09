import "server-only";

import { cookies } from "next/headers";
import type { Language } from "@/types";
import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE, translate } from "./dictionaries";
import type { TranslationKey } from "./dictionaries";

/**
 * Reads the persisted language on the server so the first server-rendered HTML
 * already carries the right `lang` attribute and metadata — no flash of the
 * wrong language on hydration.
 */
export async function getServerLanguage(): Promise<Language> {
  const store = await cookies();
  const value = store.get(LANGUAGE_COOKIE)?.value;
  return value === "bn" || value === "en" ? value : DEFAULT_LANGUAGE;
}

/** Server-side translator for Server Components and metadata generation. */
export async function getServerTranslator() {
  const language = await getServerLanguage();
  return {
    language,
    t: (key: TranslationKey) => translate(language, key),
  };
}
