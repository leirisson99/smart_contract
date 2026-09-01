"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiBuilding2Line, RiPieChartLine, RiExchangeLine, RiUserAddLine } from "@remixicon/react";
import { cx } from "@/lib/utils";

const links = [
  { href: "/imoveis", label: "Imóveis", icon: RiBuilding2Line },
  { href: "/portfolio", label: "Portfólio", icon: RiPieChartLine },
  { href: "/mercado-secundario", label: "Mercado", icon: RiExchangeLine },
  { href: "/cadastro", label: "Cadastro", icon: RiUserAddLine },
];

function NavInvestidorHeader() {
  const pathname = usePathname();
  return (
    <header className="border-b border-outline-variant bg-primary text-on-primary">
      <div className="mx-auto flex w-full max-w-(--breakpoint-xl) items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/imoveis" className="text-title-md font-bold tracking-tight">
          Patrimônio Digital
        </Link>
        <nav className="hidden gap-6 sm:flex" aria-label="Navegação principal">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cx(
                  "flex items-center gap-1.5 text-label-sm font-medium transition-opacity",
                  active ? "opacity-100" : "opacity-70 hover:opacity-100",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function NavInvestidorBottom() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegação principal"
      className="sticky bottom-0 flex border-t border-outline-variant bg-surface-container-lowest sm:hidden"
    >
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cx(
              "flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-mono-label",
              active ? "text-primary" : "text-on-surface-variant",
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export { NavInvestidorHeader, NavInvestidorBottom };
