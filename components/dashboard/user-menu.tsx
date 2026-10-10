"use client";

import { useTransition } from "react";
import Link from "next/link";
import { LogOut, User, Settings, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/app/actions/auth";
import { useTranslation } from "@/lib/i18n";
import { getInitials } from "@/lib/utils";

/**
 * Topbar account menu. Server-rendered profile fields are passed in as props so
 * this stays a light client component (it only needs interactivity for the
 * dropdown and the logout transition).
 */
export function UserMenu({
  fullName,
  email,
  avatarUrl,
  isAdmin,
}: {
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  isAdmin: boolean;
}) {
  const { t } = useTranslation();
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      // logoutAction ends in redirect("/login"); the toast fires optimistically
      // before navigation. It never resolves to a value we branch on.
      toast.success(t("auth.logoutSuccess"));
      await logoutAction();
    });
  }

  const displayName = fullName?.trim() || email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 gap-2 px-1.5 sm:px-2"
          aria-label={t("nav.account")}
        >
          <Avatar className="size-7">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
            <AvatarFallback>{getInitials(fullName ?? email)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
            {displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-semibold">{displayName}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer gap-2">
            <User className="size-4" aria-hidden="true" />
            {t("nav.profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer gap-2">
            <Settings className="size-4" aria-hidden="true" />
            {t("nav.settings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            // Prevent the menu's default focus-return so the redirect isn't
            // interrupted mid-navigation.
            event.preventDefault();
            handleLogout();
          }}
          disabled={pending}
          className="cursor-pointer gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" aria-hidden="true" />
          {t("nav.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
