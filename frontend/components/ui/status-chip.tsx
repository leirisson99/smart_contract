import React from "react";
import type { VariantProps } from "tailwind-variants";
import { tv } from "@/lib/tv";
import { cx } from "@/lib/utils";

const statusChipVariants = tv({
  base: "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-label-sm font-medium",
  variants: {
    tone: {
      neutral: "bg-surface-container text-on-surface-variant",
      info: "bg-primary-container text-on-primary-container",
      success: "bg-secondary-container text-on-secondary-container",
      warning: "bg-warning-container text-on-warning-container",
      error: "bg-error-container text-on-error-container",
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
});

export type StatusChipTone = NonNullable<VariantProps<typeof statusChipVariants>["tone"]>;

interface StatusChipProps
  extends React.ComponentPropsWithoutRef<"span">,
    VariantProps<typeof statusChipVariants> {}

const StatusChip = React.forwardRef<HTMLSpanElement, StatusChipProps>(
  ({ className, tone, ...props }, forwardedRef) => (
    <span ref={forwardedRef} className={cx(statusChipVariants({ tone }), className)} {...props} />
  ),
);
StatusChip.displayName = "StatusChip";

export { StatusChip, statusChipVariants };
