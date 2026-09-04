"use client";

import { PortfolioSummary } from "@/components/portfolio/portfolio-summary";
import { HoldingsTable } from "@/components/portfolio/holdings-table";
import { YieldHistoryList } from "@/components/portfolio/yield-history-list";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { obterPortfolio } from "@/lib/api/portfolio";
import { useAsyncData } from "@/lib/hooks/use-async-data";

export default function PortfolioPage() {
  const { data: portfolio, erro, recarregar } = useAsyncData(obterPortfolio);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-headline-lg-mobile font-bold tracking-tight sm:text-headline-lg">Meu Portfólio</h1>
      {erro ? (
        <Alert tone="error">{erro}</Alert>
      ) : !portfolio ? (
        <Spinner className="size-6" />
      ) : (
        <>
          <PortfolioSummary
            valorTotalInvestido={portfolio.valorTotalInvestido}
            rendimentoPendenteClaim={portfolio.rendimentoPendenteClaim}
            onClaimSucesso={recarregar}
          />
          <HoldingsTable holdings={portfolio.holdings} />
          <YieldHistoryList rendimentos={portfolio.rendimentosRecebidos} />
        </>
      )}
    </div>
  );
}
