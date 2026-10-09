import { Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Brand mark.
 *
 * Deliberately an original icon + wordmark, NOT the DESCO corporate logo —
 * this is an independent tool and has no licence to use their trademark.
 */
export function Logo({
  className,
  href = "/",
  showTagline = false,
  size = "default",
}: {
  className?: string;
  href?: string | null;
  showTagline?: boolean;
  size?: "sm" | "default" | "lg";
}) {
  const sizes = {
    sm: { box: "size-7", icon: "size-3.5", title: "text-sm", tag: "text-[10px]" },
    default: { box: "size-9", icon: "size-4.5", title: "text-base", tag: "text-[11px]" },
    lg: { box: "size-11", icon: "size-5.5", title: "text-lg", tag: "text-xs" },
  }[size];

  const content = (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative grid place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20",
          sizes.box,
        )}
      >
        <Zap className={cn("text-primary-foreground", sizes.icon)} fill="currentColor" />
      </span>
      <span className="flex flex-col leading-none">
        <span className={cn("font-bold tracking-tight", sizes.title)}>
          DESCO <span className="text-primary">SMART</span>
        </span>
        {showTagline && (
          <span className={cn("mt-1 text-muted-foreground", sizes.tag)}>
            Prepaid Balance Monitor
          </span>
        )}
      </span>
    </span>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label="DESCO SMART — home"
    >
      {content}
    </Link>
  );
}
