"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Theme provider.
 *
 * `attribute="class"` drives the `.dark` class that Tailwind's `darkMode:
 * ["class"]` selector keys off, so all the CSS custom properties in globals.css
 * swap without any `dark:` prefixes in components.
 *
 * Dark is the default per the product spec. `enableSystem` still allows an
 * explicit "System" choice.
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      // Suppresses the transition flash when the theme flips.
      disableTransitionOnChange
      storageKey="desco-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
