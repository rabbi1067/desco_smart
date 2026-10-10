import Link from "next/link";
import { requireProfile, isAdmin as checkIsAdmin } from "@/lib/auth";
import { getUnreadCount, getNotifications } from "@/lib/services/notifications";
import { Logo } from "@/components/shared/logo";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { UserMenu } from "@/components/dashboard/user-menu";
import { NotificationBell } from "@/components/dashboard/notification-bell";

/**
 * Authenticated app shell.
 *
 * `requireProfile()` is the gate: no profile row → redirect to /login. This runs
 * on the server for every route in the group, so the middleware and this layout
 * form two independent barriers (and the data layer's RLS is a third).
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const [admin, unreadCount, recentNotifications] = await Promise.all([
    checkIsAdmin(),
    getUnreadCount(),
    getNotifications(6),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <MobileNav isAdmin={admin} />
          <Logo />
          <div className="ml-auto flex items-center gap-1.5">
            <NotificationBell unreadCount={unreadCount} notifications={recentNotifications} />
            <LanguageToggle />
            <ThemeToggle />
            <UserMenu
              fullName={profile.full_name}
              email={profile.email}
              avatarUrl={profile.avatar_url}
              isAdmin={admin}
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 border-r border-border/60 lg:flex">
          <div className="flex h-full w-full flex-col overflow-y-auto p-4">
            <SidebarNav isAdmin={admin} />
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>

      <footer className="border-t border-border/60 py-4">
        <p className="px-4 text-center text-xs text-muted-foreground sm:px-6">
          <Link href="/" className="hover:text-foreground">
            DESCO SMART
          </Link>{" "}
          © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
