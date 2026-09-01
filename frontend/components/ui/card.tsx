import React from "react";
import { cx } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, forwardedRef) => (
    <div
      ref={forwardedRef}
      className={cx(
        "rounded-lg border border-outline-variant bg-surface-container-lowest shadow-card",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, forwardedRef) => (
    <div ref={forwardedRef} className={cx("flex flex-col gap-1 p-4 sm:p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<"h3">>(
  ({ className, ...props }, forwardedRef) => (
    <h3 ref={forwardedRef} className={cx("text-title-md font-semibold text-on-surface", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.ComponentPropsWithoutRef<"p">>(
  ({ className, ...props }, forwardedRef) => (
    <p ref={forwardedRef} className={cx("text-label-sm text-on-surface-variant", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, forwardedRef) => (
    <div ref={forwardedRef} className={cx("p-4 pt-0 sm:p-6 sm:pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, forwardedRef) => (
    <div ref={forwardedRef} className={cx("flex items-center gap-3 p-4 pt-0 sm:p-6 sm:pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
