import { AppShell } from "@/components/layout/app-shell";
import { NavAdminHeader } from "@/components/layout/nav-admin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell header={<NavAdminHeader />}>{children}</AppShell>;
}
