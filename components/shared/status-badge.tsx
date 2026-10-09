"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Loader2,
  PowerOff,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { MeterStatus } from "@/types";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

/**
 * Status pill.
 *
 * Accessibility: status is conveyed by an ICON plus TEXT, never by colour
 * alone, so it remains readable for colour-blind users and in high-contrast
 * modes.
 */
const STATUS_CONFIG: Record<
  MeterStatus,
  {
    variant: "healthy" | "low" | "critical" | "info" | "secondary" | "outline";
    icon: typeof CheckCircle2;
    labelKey: TranslationKey;
  }
> = {
  healthy: { variant: "healthy", icon: CheckCircle2, labelKey: "status.healthy" },
  low: { variant: "low", icon: AlertTriangle, labelKey: "status.low" },
  critical: { variant: "critical", icon: XCircle, labelKey: "status.critical" },
  checking: { variant: "info", icon: Loader2, labelKey: "status.checking" },
  error: { variant: "critical", icon: AlertTriangle, labelKey: "status.error" },
  disabled: { variant: "secondary", icon: PowerOff, labelKey: "status.disabled" },
};

export function StatusBadge({
  status,
  className,
  showIcon = true,
}: {
  status: MeterStatus;
  className?: string;
  showIcon?: boolean;
}) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status] ?? {
    variant: "outline" as const,
    icon: CircleDashed,
    labelKey: "status.checking" as TranslationKey,
  };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn("gap-1.5", className)}>
      {showIcon && (
        <Icon
          className={cn("size-3", status === "checking" && "animate-spin")}
          aria-hidden="true"
        />
      )}
      {t(config.labelKey)}
    </Badge>
  );
}
