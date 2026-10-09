import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getUnreadCount } from "@/lib/services/notifications";
import { getServerTranslator } from "@/lib/i18n/server";
import { Logo } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/dashboard/user-menu";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";

/**
 * Super Admin shell.
 *
 * `requireAdmin()` is the gate: a non-admin is redirected to /unauthorized and a
 * signed-out user to /login. This runs on the server for every route in the
 * group — one of three independent barriers (middleware, this guard, and the
 * service layer's `isAdmin()` re-check before the service-role client is used).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin();
  const [unreadCount, { t }] = await Promise.all([
    getUnreadCount(),
    getServerTranslator(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <AdminMobileNav />
          <Logo />
          <Badge variant="info" className="hidden sm:inline-flex">
            {t("admin.badge")}
          </Badge>
          <div className="ml-auto flex items-center gap-1.5">
            <NotificationBell unreadCount={unreadCount} />
            <LanguageToggle />
            <ThemeToggle />
            <UserMenu
              fullName={profile.full_name}
              email={profile.email}
              avatarUrl={profile.avatar_url}
              isAdmin
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 border-r border-border/60 lg:flex">
          <div className="flex h-full w-full flex-col overflow-y-auto p-4">
            <AdminNav />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>

      <footer className="border-t border-border/60 py-4">
        <p className="px-4 text-center text-xs text-muted-foreground sm:px-6">
          <Link href="/dashboard" className="hover:text-foreground">
            DESCO SMART
          </Link>{" "}
          · {t("admin.executiveControl")}
        </p>
      </footer>
    </div>
  );
}
