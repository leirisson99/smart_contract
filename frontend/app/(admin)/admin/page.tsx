"use client";

import { useCallback, useEffect, useState } from "react";
import { CreatePropertyForm } from "@/components/admin/create-property-form";
import { DepositYieldForm } from "@/components/admin/deposit-yield-form";
import { InvestorsTable } from "@/components/admin/investors-table";
import { Spinner } from "@/components/ui/spinner";
import { listarInvestidoresAdmin } from "@/lib/api/admin";
import { listarImoveis } from "@/lib/api/imoveis";
import type { Imovel, Investidor } from "@/lib/api/types";

export default function AdminPage() {
  const [imoveis, setImoveis] = useState<Imovel[] | null>(null);
  const [investidores, setInvestidores] = useState<Investidor[] | null>(null);

  const carregarImoveis = useCallback(() => {
    listarImoveis().then(setImoveis);
  }, []);

  useEffect(() => {
    carregarImoveis();
    listarInvestidoresAdmin().then(setInvestidores);
  }, [carregarImoveis]);

  if (!imoveis || !investidores) return <Spinner className="size-6" />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-headline-lg-mobile font-bold tracking-tight sm:text-headline-lg">Painel do Gestor</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <CreatePropertyForm onCriado={carregarImoveis} />
        <DepositYieldForm imoveis={imoveis} />
      </div>
      <InvestorsTable investidores={investidores} />
    </div>
  );
}
