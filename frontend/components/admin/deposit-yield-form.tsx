"use client";

import { useState, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { TransactionalButton, type TransactionState } from "@/components/feedback/transactional-button";
import { depositarRendimento } from "@/lib/api/admin";
import { traduzirErro } from "@/lib/errors";
import type { Imovel } from "@/lib/api/types";

function DepositYieldForm({ imoveis }: { imoveis: Imovel[] }) {
  const [imovelId, setImovelId] = useState(imoveis[0]?.id ?? "");
  const [valor, setValor] = useState(0);
  const [state, setState] = useState<TransactionState>("idle");
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setState("processando");
    setErro(null);
    try {
      await depositarRendimento(imovelId, valor);
      setState("sucesso");
      setTimeout(() => setState("idle"), 1500);
    } catch (error) {
      setState("erro");
      setErro(traduzirErro(error));
    }
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
