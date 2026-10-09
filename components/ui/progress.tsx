import * as React from "react";

import { clampPercent, cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–100. Values outside the range are clamped so the bar never overflows. */
  value?: number;
  /** Extra classes for the filled indicator, e.g. `bg-critical`. */
  indicatorClassName?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorClassName, ...props }, ref) => {
    const percent = clampPercent(value);

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full w-full flex-1 rounded-full bg-primary transition-transform duration-500 ease-out",
            indicatorClassName,
          )}
          style={{ transform: `translateX(-${100 - percent}%)` }}
        />
      </div>
    );
  },
);
Progress.displayName = "Progress";

export { Progress };
