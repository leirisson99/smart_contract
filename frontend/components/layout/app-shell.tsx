import React from "react";
import { cx } from "@/lib/utils";

interface AppShellProps {
  header: React.ReactNode;
  bottomNav?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function AppShell({ header, bottomNav, children, className }: AppShellProps) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      {header}
      <main className={cx("mx-auto w-full max-w-(--breakpoint-xl) flex-1 px-4 py-6 sm:px-6 sm:py-8", className)}>
        {children}
      </main>
      {bottomNav}
    </div>
  );
}

export { AppShell };
