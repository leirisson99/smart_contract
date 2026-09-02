"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { TransactionalButton, type TransactionState } from "@/components/feedback/transactional-button";
import { PurchaseSuccessPanel } from "./purchase-success-panel";
import { comprarCotas } from "@/lib/api/imoveis";
import { traduzirErro } from "@/lib/errors";
import { formatCurrency } from "@/lib/format";
import type { Imovel } from "@/lib/api/types";

function PropertyPurchasePanel({ imovel }: { imovel: Imovel }) {
  const minCotas = Math.max(1, Math.ceil(imovel.valorMinimoInvestimento / imovel.precoPorCota));
  const [quantidade, setQuantidade] = useState(minCotas);
  const [state, setState] = useState<TransactionState>("idle");
  const [erro, setErro] = useState<string | null>(null);
  const [concluida, setConcluida] = useState(false);

  const valorInvestido = quantidade * imovel.precoPorCota;

  if (concluida) {
    return <PurchaseSuccessPanel imovelNome={imovel.nome} cotas={quantidade} valorInvestido={valorInvestido} />;
  }

  async function handleConfirmar() {
    setState("processando");
    setErro(null);
    try {
      await comprarCotas(imovel.id, quantidade);
      setState("sucesso");
      setConcluida(true);
    } catch (error) {
      setState("erro");
      setErro(traduzirErro(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investir neste imóvel</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {erro ? <Alert tone="error">{erro}</Alert> : null}
        <div>
          <Label htmlFor="quantidade">Quantidade de cotas</Label>
          <Input
            id="quantidade"
            type="number"
            min={minCotas}
            max={imovel.cotasRestantes}
            value={quantidade}
            onChange={(event) => setQuantidade(Number(event.target.value))}
          />
          <p className="mt-1 text-mono-label text-on-surface-variant">
            Mínimo {minCotas} {minCotas === 1 ? "cota" : "cotas"} · {imovel.cotasRestantes} disponíveis
          </p>
        </div>
        <div className="flex items-baseline justify-between rounded bg-surface-container-low px-3 py-2 text-body-md">
          <span className="text-on-surface-variant">Valor total</span>
          <span className="text-title-md font-semibold">{formatCurrency(valorInvestido)}</span>
        </div>
        <TransactionalButton
          state={state}
          idleLabel="Confirmar compra"
          onClick={handleConfirmar}
          disabled={quantidade < minCotas || quantidade > imovel.cotasRestantes}
          className="w-full"
        />
      </CardContent>
    </Card>
  );
}

export { PropertyPurchasePanel };
