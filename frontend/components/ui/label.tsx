import React from "react";
import { cx } from "@/lib/utils";

const Label = React.forwardRef<HTMLLabelElement, React.ComponentPropsWithoutRef<"label">>(
  ({ className, ...props }, forwardedRef) => (
    <label
      ref={forwardedRef}
      className={cx("mb-1.5 block text-label-sm font-medium text-on-surface", className)}
      {...props}
    />
  ),
);
Label.displayName = "Label";

export { Label };
