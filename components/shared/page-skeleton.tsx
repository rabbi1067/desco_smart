import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generic route-loading placeholder used by App Router `loading.tsx` boundaries.
 *
 * Mirrors the common page shape — heading, a row of stat cards, and a tall
 * content panel — so the layout does not shift when the real server component
 * streams in. Purely presentational and `aria-hidden` (each Skeleton is), so it
 * is announced as nothing rather than as empty content.
 */
export function PageSkeleton({
  stats = 4,
  showStats = true,
}: {
  stats?: number;
  showStats?: boolean;
}) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {/* Stat cards */}
      {showStats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: stats }).map((_, i) => (
            <div
              key={i}
              className="space-y-3 rounded-xl border border-border p-5"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      )}

      {/* Content panel */}
      <div className="space-y-4 rounded-xl border border-border p-5">
        <Skeleton className="h-5 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
