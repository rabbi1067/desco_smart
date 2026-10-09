"use client";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Shared card frame for every auth screen. Keeps the title/subtitle rhythm and
 * card chrome identical across login, register and the password flows.
 */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="border-border/60 shadow-lg animate-fade-up">
      <CardContent className="p-6 sm:p-8">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="mt-6">{children}</div>
        {footer && (
          <div className="mt-6 border-t border-border/60 pt-5 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
