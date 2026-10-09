"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Labeled form field with an accessible error slot.
 *
 * The error is wired via `aria-describedby` / `aria-invalid` on the child input
 * (the form passes those in), and announced with `role="alert"` so screen
 * readers hear it the moment it appears. Status is never conveyed by colour
 * alone — the message text is always present.
 */
export function FormField({
  id,
  label,
  error,
  hint,
  optional,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {optional && (
          <span className="text-xs text-muted-foreground">{optional}</span>
        )}
      </div>
      {children}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
