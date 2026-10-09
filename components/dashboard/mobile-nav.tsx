"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/shared/logo";
import { SidebarNav } from "./sidebar-nav";
import { useTranslation } from "@/lib/i18n";

/**
 * Mobile navigation drawer. Shown only below the `lg` breakpoint, where the
 * persistent sidebar is hidden. Tapping any link closes the sheet via the
 * `onNavigate` callback wired into the shared SidebarNav.
 */
export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={t("nav.openMenu")}
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-full max-w-xs flex-col">
        <SheetHeader>
          <SheetTitle className="text-left">
            <Logo href={null} />
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex flex-1 flex-col">
          <SidebarNav isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
