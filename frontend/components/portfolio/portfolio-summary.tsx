"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { TransactionalButton, type TransactionState } from "@/components/feedback/transactional-button";
import { Alert } from "@/components/ui/alert";
import { claimRendimentos } from "@/lib/api/portfolio";
import { traduzirErro } from "@/lib/errors";
import { formatCurrency } from "@/lib/format";

interface PortfolioSummaryProps {
  valorTotalInvestido: number;
  rendimentoPendenteClaim: number;
  onClaimSucesso: () => void;
}

function PortfolioSummary({ valorTotalInvestido, rendimentoPendenteClaim, onClaimSucesso }: PortfolioSummaryProps) {
  const [state, setState] = useState<TransactionState>("idle");
  const [erro, setErro] = useState<string | null>(null);

  async function handleClaim() {
    setState("processando");
    setErro(null);
    try {
      await claimRendimentos();
      setState("sucesso");
      onClaimSucesso();
    } catch (error) {
      setState("erro");
      setErro(traduzirErro(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo do portfólio</CardTitle>
        <CardDescription>Valor investido e rendimentos disponíveis para resgate.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {erro ? <Alert tone="error" className="sm:col-span-2">{erro}</Alert> : null}
        <div className="rounded bg-surface-container-low p-4">
          <p className="text-label-sm text-on-surface-variant">Valor total investido</p>
          <p className="text-headline-lg-mobile font-bold tracking-tight sm:text-headline-lg">
            {formatCurrency(valorTotalInvestido)}
          </p>
        </div>
        <div className="rounded bg-secondary-container p-4">
          <p className="text-label-sm text-on-secondary-container">Rendimento pendente de resgate</p>
          <p className="text-headline-lg-mobile font-bold tracking-tight text-on-secondary-container sm:text-headline-lg">
            {formatCurrency(rendimentoPendenteClaim)}
          </p>
        </div>
      </CardContent>
      {rendimentoPendenteClaim > 0 ? (
        <CardFooter>
          <TransactionalButton
            state={state}
            idleLabel="Resgatar rendimentos"
            variant="secondary"
            onClick={handleClaim}
          />
        </CardFooter>
      ) : null}
    </Card>
  );
}

export { PortfolioSummary };
