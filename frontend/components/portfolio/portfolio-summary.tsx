"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { TransactionalButton } from "@/components/feedback/transactional-button";
import { useTransacao } from "@/components/feedback/use-transacao";
import { Alert } from "@/components/ui/alert";
import { claimRendimentos } from "@/lib/api/portfolio";
import { formatCurrency } from "@/lib/format";

interface PortfolioSummaryProps {
  valorTotalInvestido: number;
  rendimentoPendenteClaim: number;
  onClaimSucesso: () => void;
}

function PortfolioSummary({ valorTotalInvestido, rendimentoPendenteClaim, onClaimSucesso }: PortfolioSummaryProps) {
  const { state, erro, executar } = useTransacao();

  function handleClaim() {
    executar(() => claimRendimentos(), onClaimSucesso);
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
