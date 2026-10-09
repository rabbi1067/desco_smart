import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Canonical empty state.
 *
 * Used everywhere a real query legitimately returns nothing. This is the
 * project's answer to "no fake seed data": an empty database renders THIS,
 * not invented rows.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/30 text-center",
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-14",
        className,
      )}
    >
      <div
        className={cn(
          "grid place-items-center rounded-full bg-muted/60 text-muted-foreground",
          compact ? "size-10" : "size-14",
        )}
      >
        <Icon className={compact ? "size-5" : "size-7"} aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className={cn("font-semibold", compact ? "text-sm" : "text-base")}>
          {title}
        </p>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
