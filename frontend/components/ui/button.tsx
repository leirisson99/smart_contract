import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { RiLoader2Fill } from "@remixicon/react";
import type { VariantProps } from "tailwind-variants";
import { tv } from "@/lib/tv";

import { cx, focusRing } from "@/lib/utils";

const buttonVariants = tv({
  base: [
    "relative inline-flex min-h-12 items-center justify-center gap-1.5 whitespace-nowrap rounded border px-4 py-2 text-center text-body-md font-medium transition-colors duration-100 ease-in-out",
    "disabled:pointer-events-none disabled:opacity-50",
    focusRing,
  ],
  variants: {
    variant: {
      primary: [
        "border-transparent text-on-primary bg-primary",
        "hover:bg-[#0d3357]",
        "disabled:bg-primary",
      ],
      secondary: [
        "border-transparent text-on-secondary bg-secondary",
        "hover:bg-[#00714b]",
      ],
      outline: [
        "border-outline-variant text-on-surface bg-surface-container-lowest",
        "hover:bg-surface-container-low",
      ],
      ghost: [
        "border-transparent text-on-surface bg-transparent",
        "hover:bg-surface-container-low",
      ],
      destructive: ["border-transparent text-on-error bg-error", "hover:bg-[#93000a]"],
    },
    size: {
      md: "px-4 py-2 text-body-md",
      sm: "min-h-9 px-3 py-1.5 text-label-sm",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

interface ButtonProps
  extends React.ComponentPropsWithoutRef<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { asChild, isLoading = false, loadingText, className, disabled, variant, size, children, ...props }: ButtonProps,
    forwardedRef,
  ) => {
    const Component = asChild ? Slot : "button";
    return (
      <Component
        ref={forwardedRef}
        className={cx(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="pointer-events-none flex shrink-0 items-center justify-center gap-1.5">
            <RiLoader2Fill className="size-4 shrink-0 animate-spin" aria-hidden="true" />
            <span>{loadingText ? loadingText : children}</span>
          </span>
        ) : (
          children
        )}
      </Component>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants, type ButtonProps };
