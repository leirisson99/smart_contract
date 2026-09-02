"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { TransactionalButton, type TransactionState } from "@/components/feedback/transactional-button";
import { comprarListagem, cancelarListagem } from "@/lib/api/marketplace";
import { traduzirErro } from "@/lib/errors";
import { formatCurrency } from "@/lib/format";
import type { Listagem } from "@/lib/api/types";

function ListingCard({ listagem, onAtualizado }: { listagem: Listagem; onAtualizado: () => void }) {
  const [state, setState] = useState<TransactionState>("idle");
  const [erro, setErro] = useState<string | null>(null);

  async function executar(acao: () => Promise<void>) {
    setState("processando");
    setErro(null);
    try {
      await acao();
      setState("sucesso");
      onAtualizado();
    } catch (error) {
      setState("erro");
      setErro(traduzirErro(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{listagem.imovelNome}</CardTitle>
        <p className="text-label-sm text-on-surface-variant">Vendedor: {listagem.vendedorNome}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {erro ? <Alert tone="error">{erro}</Alert> : null}
        <div className="flex items-baseline justify-between text-body-md">
          <span className="text-on-surface-variant">Cotas</span>
          <span className="font-medium">{listagem.cotas}</span>
        </div>
        <div className="flex items-baseline justify-between text-body-md">
          <span className="text-on-surface-variant">Preço por cota</span>
          <span className="font-semibold">{formatCurrency(listagem.precoPorCota)}</span>
        </div>
        <div className="flex items-baseline justify-between text-title-md">
          <span className="text-on-surface-variant text-body-md">Total</span>
          <span className="font-bold">{formatCurrency(listagem.precoPorCota * listagem.cotas)}</span>
        </div>
      </CardContent>
      <CardFooter>
        {listagem.criadaPeloUsuarioAtual ? (
          <TransactionalButton
            state={state}
            variant="outline"
            idleLabel="Cancelar listagem"
            onClick={() => executar(() => cancelarListagem(listagem.id))}
            className="w-full"
          />
        ) : (
          <TransactionalButton
            state={state}
            variant="secondary"
            idleLabel="Comprar"
            onClick={() => executar(() => comprarListagem(listagem.id))}
            className="w-full"
          />
        )}
      </CardFooter>
    </Card>
  );
}

export { ListingCard };
