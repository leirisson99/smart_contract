import Link from "next/link";

function NavAdminHeader() {
  return (
    <header className="border-b border-outline-variant bg-primary text-on-primary">
      <div className="mx-auto flex w-full max-w-(--breakpoint-xl) items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/admin" className="text-title-md font-bold tracking-tight">
          Patrimônio Digital <span className="font-normal opacity-70">— Painel do Gestor</span>
        </Link>
        <Link href="/imoveis" className="text-label-sm opacity-70 hover:opacity-100">
          Ver como investidor
        </Link>
      </div>
    </header>
  );
}

export { NavAdminHeader };
