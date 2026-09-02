import { AppShell } from "@/components/layout/app-shell";
import { NavInvestidorHeader, NavInvestidorBottom } from "@/components/layout/nav-investidor";

export default function InvestidorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell header={<NavInvestidorHeader />} bottomNav={<NavInvestidorBottom />}>
      {children}
    </AppShell>
  );
}
