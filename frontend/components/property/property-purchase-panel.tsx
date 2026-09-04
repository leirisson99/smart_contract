"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { TransactionalButton } from "@/components/feedback/transactional-button";
import { useTransacao } from "@/components/feedback/use-transacao";
import { PurchaseSuccessPanel } from "./purchase-success-panel";
import { comprarCotas } from "@/lib/api/imoveis";
import { formatCurrency } from "@/lib/format";
import type { Imovel } from "@/lib/api/types";

function PropertyPurchasePanel({ imovel }: { imovel: Imovel }) {
  const minCotas = Math.max(1, Math.ceil(imovel.valorMinimoInvestimento / imovel.precoPorCota));
  const cotasInsuficientes = imovel.cotasRestantes < minCotas;
  const [quantidade, setQuantidade] = useState(minCotas);
  const { state, erro, executar } = useTransacao();
  const [concluida, setConcluida] = useState(false);

  const valorInvestido = quantidade * imovel.precoPorCota;

  if (concluida) {
    return <PurchaseSuccessPanel imovelNome={imovel.nome} cotas={quantidade} valorInvestido={valorInvestido} />;
  }

  function handleConfirmar() {
    executar(
      () => comprarCotas(imovel.id, quantidade),
      () => setConcluida(true),
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investir neste imóvel</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {erro ? <Alert tone="error">{erro}</Alert> : null}
        {cotasInsuficientes ? (
          <Alert tone="info">
            Restam apenas {imovel.cotasRestantes} {imovel.cotasRestantes === 1 ? "cota" : "cotas"}, abaixo do mínimo
            de {minCotas} necessário para investir neste imóvel.
          </Alert>
        ) : (
          <div>
            <Label htmlFor="quantidade">Quantidade de cotas</Label>
            <Input
              id="quantidade"
              type="number"
              min={minCotas}
              max={imovel.cotasRestantes}
              step={1}
              value={quantidade}
              onChange={(event) => setQuantidade(Math.floor(Number(event.target.value)))}
            />
            <p className="mt-1 text-mono-label text-on-surface-variant">
              Mínimo {minCotas} {minCotas === 1 ? "cota" : "cotas"} · {imovel.cotasRestantes} disponíveis
            </p>
          </div>
        )}
        <div className="flex items-baseline justify-between rounded bg-surface-container-low px-3 py-2 text-body-md">
          <span className="text-on-surface-variant">Valor total</span>
          <span className="text-title-md font-semibold">{formatCurrency(valorInvestido)}</span>
        </div>
        <TransactionalButton
          state={state}
          idleLabel="Confirmar compra"
          onClick={handleConfirmar}
          disabled={
            cotasInsuficientes ||
            quantidade < minCotas ||
            quantidade > imovel.cotasRestantes ||
            !Number.isInteger(quantidade)
          }
          className="w-full"
        />
      </CardContent>
    </Card>
  );
}

export { PropertyPurchasePanel };
