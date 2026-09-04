"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { KYC_STATUS_TONE } from "@/components/kyc/kyc-status";
import type { Investidor, StatusKyc } from "@/lib/api/types";

const LABEL: Record<StatusKyc, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

function InvestorsTable({ investidores }: { investidores: Investidor[] }) {
  const [filtro, setFiltro] = useState<StatusKyc | "todos">("todos");
  const filtrados = useMemo(
    () => (filtro === "todos" ? investidores : investidores.filter((item) => item.statusKyc === filtro)),
    [filtro, investidores],
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Investidores</CardTitle>
        <select
          aria-label="Filtrar por status de KYC"
          className="min-h-9 rounded border border-outline-variant bg-surface-container-lowest px-2 text-label-sm"
          value={filtro}
          onChange={(event) => setFiltro(event.target.value as StatusKyc | "todos")}
        >
          <option value="todos">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="aprovado">Aprovado</option>
          <option value="reprovado">Reprovado</option>
        </select>
      </CardHeader>
      <CardContent className="p-0 sm:p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-body-md">
            <thead>
              <tr className="border-b border-outline-variant text-left text-label-sm text-on-surface-variant">
                <th className="px-4 py-2 sm:px-6">Nome</th>
                <th className="px-4 py-2 sm:px-6">Carteira</th>
                <th className="px-4 py-2 sm:px-6">KYC</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((investidor) => (
                <tr key={investidor.id} className="border-b border-outline-variant last:border-0">
                  <td className="px-4 py-3 font-medium sm:px-6">{investidor.nome}</td>
                  <td className="px-4 py-3 font-mono text-label-sm text-on-surface-variant sm:px-6">
                    {investidor.walletAddress ?? "—"}
                  </td>
                  <td className="px-4 py-3 sm:px-6">
                    <StatusChip tone={KYC_STATUS_TONE[investidor.statusKyc]}>{LABEL[investidor.statusKyc]}</StatusChip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export { InvestorsTable };
