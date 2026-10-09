import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Compact metric tile used across the dashboard and admin overview.
 *
 * Purely presentational and server-renderable — the label and value are already
 * resolved/formatted by the caller. `tone` only tints the icon chip; status is
 * never conveyed by colour alone (the label always names the metric).
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "healthy" | "low" | "critical" | "primary";
}) {
  const toneClasses: Record<typeof tone, string> = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    healthy: "bg-healthy/10 text-healthy-foreground",
    low: "bg-low/10 text-low-foreground",
    critical: "bg-critical/10 text-critical-foreground",
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl",
            toneClasses[tone],
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="truncate text-2xl font-bold tabular">{value}</p>
          {hint && (
            <p className="truncate text-xs text-muted-foreground/80">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
