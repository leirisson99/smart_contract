"use client";

import { useState, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { TransactionalButton } from "@/components/feedback/transactional-button";
import { useTransacao } from "@/components/feedback/use-transacao";
import { depositarRendimento } from "@/lib/api/admin";
import type { Imovel } from "@/lib/api/types";

function DepositYieldForm({ imoveis }: { imoveis: Imovel[] }) {
  const [imovelId, setImovelId] = useState(imoveis[0]?.id ?? "");
  const [valor, setValor] = useState(0);
  const { state, erro, executar } = useTransacao();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    executar(() => depositarRendimento(imovelId, valor));
  }

  if (imoveis.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Depositar rendimento mensal</CardTitle>
          <CardDescription>Distribui o aluguel do ciclo entre os investidores do imóvel, proporcionalmente às cotas.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-body-md text-on-surface-variant">Nenhum imóvel cadastrado ainda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Depositar rendimento mensal</CardTitle>
        <CardDescription>Distribui o aluguel do ciclo entre os investidores do imóvel, proporcionalmente às cotas.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          {erro ? <Alert tone="error" className="sm:col-span-2">{erro}</Alert> : null}
          <div>
            <Label htmlFor="imovel-deposito">Imóvel</Label>
            <select
              id="imovel-deposito"
              className="block w-full min-h-12 rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md"
              value={imovelId}
              onChange={(event) => setImovelId(event.target.value)}
            >
              {imoveis.map((imovel) => (
                <option key={imovel.id} value={imovel.id}>
                  {imovel.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="valor-deposito">Valor do ciclo (R$)</Label>
            <Input
              id="valor-deposito"
              type="number"
              min={1}
              value={valor}
              onChange={(event) => setValor(Number(event.target.value))}
            />
          </div>
          <div className="flex items-end sm:col-span-2">
            <TransactionalButton state={state} idleLabel="Depositar rendimento" variant="secondary" type="submit" />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export { DepositYieldForm };
