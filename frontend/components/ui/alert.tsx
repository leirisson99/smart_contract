import React from "react";
import { RiErrorWarningLine, RiCheckboxCircleLine, RiInformationLine } from "@remixicon/react";
import { tv, type VariantProps } from "tailwind-variants";
import { cx } from "@/lib/utils";

const alertVariants = tv({
  base: "flex items-start gap-3 rounded-lg border p-4 text-body-md",
  variants: {
    tone: {
      error: "border-error-container bg-error-container text-on-error-container",
      success: "border-secondary-container bg-secondary-container text-on-secondary-container",
      info: "border-outline-variant bg-surface-container text-on-surface",
    },
  },
  defaultVariants: {
    tone: "info",
  },
});

const icons = {
  error: RiErrorWarningLine,
  success: RiCheckboxCircleLine,
  info: RiInformationLine,
} as const;

interface AlertProps
  extends React.ComponentPropsWithoutRef<"div">,
    VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, tone = "info", children, ...props }, forwardedRef) => {
    const Icon = icons[tone ?? "info"];
    return (
      <div ref={forwardedRef} role="alert" className={cx(alertVariants({ tone }), className)} {...props}>
        <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div className="flex-1">{children}</div>
      </div>
    );
  },
);
Alert.displayName = "Alert";

export { Alert, alertVariants };
