"use client";

import { useCallback, useEffect, useState } from "react";
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary";
import { HoldingsTable } from "@/components/portfolio/holdings-table";
import { YieldHistoryList } from "@/components/portfolio/yield-history-list";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { obterPortfolio } from "@/lib/api/portfolio";
import type { Portfolio } from "@/lib/api/types";
import { traduzirErro } from "@/lib/errors";

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(() => {
    obterPortfolio()
      .then(setPortfolio)
      .catch((error) => setErro(traduzirErro(error)));
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

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
            onClaimSucesso={carregar}
          />
          <HoldingsTable holdings={portfolio.holdings} />
          <YieldHistoryList rendimentos={portfolio.rendimentosRecebidos} />
        </>
      )}
    </div>
  );
}
