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
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Topbar: Permanently locked at top */}
      <header className="h-16 shrink-0 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-50">
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

      {/* Main app body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop sidebar: Permanently locked on the left, does not scroll with main content */}
        <aside className="hidden w-64 shrink-0 border-r border-border/60 lg:flex flex-col overflow-y-auto bg-background/95 p-4 select-none">
          <SidebarNav isAdmin={admin} />
        </aside>

        {/* Main content: ONLY this container scrolls vertically! */}
        <main className="flex-1 min-h-0 overflow-y-auto w-full bg-background/40">
          <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-[calc(100vh-4rem-4rem)]">
            {children}
          </div>

          <footer className="border-t border-border/60 py-4 mt-8">
            <p className="px-4 text-center text-xs text-muted-foreground sm:px-6">
              <Link href="/" className="hover:text-foreground">
                DESCO SMART
              </Link>{" "}
              © {new Date().getFullYear()}
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
