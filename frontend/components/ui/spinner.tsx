import React from "react";
import { RiLoader2Fill } from "@remixicon/react";
import { cx } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <RiLoader2Fill
      className={cx("size-4 animate-spin text-current", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Spinner };
