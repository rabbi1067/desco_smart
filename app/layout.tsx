import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { I18nProvider } from "@/lib/i18n/provider";
import { getServerLanguage } from "@/lib/i18n/server";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DESCO SMART — Prepaid Balance Monitor",
    template: "%s | DESCO SMART",
  },
  description:
    "Monitor DESCO prepaid electricity balances across multiple meters, track balance history and consumption analytics, and receive automated low-balance email alerts.",
  keywords: [
    "DESCO",
    "prepaid meter",
    "electricity balance",
    "Dhaka",
    "balance monitor",
    "low balance alert",
  ],
  authors: [{ name: "Md. Fazley Rabbi" }],
  openGraph: {
    type: "website",
    siteName: "DESCO SMART",
    title: "DESCO SMART — Prepaid Balance Monitor",
    description:
      "Never get disconnected in the dark. Automated DESCO prepaid balance monitoring with multi-meter support and low-balance alerts.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DESCO SMART — Prepaid Balance Monitor",
    description:
      "Automated DESCO prepaid balance monitoring with multi-meter support and low-balance alerts.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1a" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read on the server so the first paint already has the right language —
  // no flash of English before hydration swaps it to Bangla.
  const language = await getServerLanguage();

  return (
    <html lang={language} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <I18nProvider initialLanguage={language}>
            {children}
            <Toaster />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
