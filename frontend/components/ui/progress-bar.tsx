import React from "react";
import { cx } from "@/lib/utils";

interface ProgressBarProps extends React.ComponentPropsWithoutRef<"div"> {
  value: number;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value, ...props }, forwardedRef) => {
    const clamped = Math.min(100, Math.max(0, value));
    return (
      <div
        ref={forwardedRef}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cx("h-2 w-full overflow-hidden rounded-full bg-surface-container-high", className)}
        {...props}
      >
        <div className="h-full rounded-full bg-secondary transition-[width]" style={{ width: `${clamped}%` }} />
      </div>
    );
  },
);
ProgressBar.displayName = "ProgressBar";

export { ProgressBar };
