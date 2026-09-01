import React from "react";
import { cx, focusInput, hasErrorInput } from "@/lib/utils";

interface InputProps extends React.ComponentPropsWithoutRef<"input"> {
  hasError?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, ...props }, forwardedRef) => (
    <input
      ref={forwardedRef}
      className={cx(
        "block w-full min-h-12 rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface placeholder:text-on-surface-variant",
        "outline-none transition-colors",
        focusInput,
        hasError && hasErrorInput,
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input, type InputProps };
