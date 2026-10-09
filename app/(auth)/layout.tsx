import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";

/**
 * Auth shell: the full public navigation on top (so visitors can still reach
 * Home, About, Features, … straight from the login/register screens) over a
 * centered column. The middleware sends already-authenticated visitors away
 * from these routes, so this layout only ever renders for signed-out users.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-grid">
      {/* Soft radial wash so the card floats above the grid without a heavy box. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 mask-fade-b"
        aria-hidden="true"
      />
      <PublicHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="px-4 py-6 text-center text-xs text-muted-foreground">
        <Link
          href="/"
          className="rounded outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          © {new Date().getFullYear()} DESCO SMART
        </Link>
      </footer>
    </div>
  );
}
