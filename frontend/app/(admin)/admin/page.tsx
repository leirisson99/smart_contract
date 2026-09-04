"use client";

import { CreatePropertyForm } from "@/components/admin/create-property-form";
import { DepositYieldForm } from "@/components/admin/deposit-yield-form";
import { InvestorsTable } from "@/components/admin/investors-table";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { listarInvestidoresAdmin } from "@/lib/api/admin";
import { listarImoveis } from "@/lib/api/imoveis";
import { useAsyncData } from "@/lib/hooks/use-async-data";

export default function AdminPage() {
  const { data: imoveis, erro: erroImoveis, recarregar: recarregarImoveis } = useAsyncData(listarImoveis);
  const { data: investidores, erro: erroInvestidores } = useAsyncData(listarInvestidoresAdmin);

  const erro = erroImoveis ?? erroInvestidores;
  if (erro) return <Alert tone="error">{erro}</Alert>;
  if (!imoveis || !investidores) return <Spinner className="size-6" />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-headline-lg-mobile font-bold tracking-tight sm:text-headline-lg">Painel do Gestor</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <CreatePropertyForm onCriado={recarregarImoveis} />
        <DepositYieldForm imoveis={imoveis} />
      </div>
      <InvestorsTable investidores={investidores} />
    </div>
  );
}
