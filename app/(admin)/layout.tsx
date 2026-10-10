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
import { AdminHeaderSearch } from "@/components/admin/admin-header-search";

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

  const isSuper = profile.role === "super_admin";

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Topbar: Permanently locked at top */}
      <header className="h-16 shrink-0 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-50">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <AdminMobileNav isSuperAdmin={isSuper} />
          <Logo />
          <Badge variant="info" className="hidden sm:inline-flex border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            {isSuper ? "Super Admin" : "Admin"}
          </Badge>

          {/* Central Live Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
            <AdminHeaderSearch />
          </div>

          <div className="ml-auto flex items-center gap-2">
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

      {/* Main app body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar: Permanently locked on the left, does not scroll with main page */}
        <aside className="hidden w-64 shrink-0 border-r border-border/60 lg:flex flex-col overflow-y-auto bg-background/95 p-4 select-none">
          <AdminNav isSuperAdmin={isSuper} />
        </aside>

        {/* Main Content: ONLY this container scrolls vertically! */}
        <main className="flex-1 min-h-0 overflow-y-auto w-full bg-background/40">
          <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-[calc(100vh-4rem-4rem)]">
            {children}
          </div>

          <footer className="border-t border-border/60 py-4 mt-8">
            <p className="px-4 text-center text-xs text-muted-foreground sm:px-6">
              <Link href="/admin" className="hover:text-foreground">
                DESCO SMART
              </Link>{" "}
              · {t("admin.executiveControl")}
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
