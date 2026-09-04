"use client";

import { useCallback } from "react";
import { ListingCard } from "@/components/marketplace/listing-card";
import { CreateListingDialog } from "@/components/marketplace/create-listing-dialog";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { listarListagens } from "@/lib/api/marketplace";
import { obterPortfolio } from "@/lib/api/portfolio";
import { useAsyncData } from "@/lib/hooks/use-async-data";

export default function MercadoSecundarioPage() {
  const { data: listagens, erro: erroListagens, recarregar: recarregarListagens } = useAsyncData(listarListagens);
  const { data: portfolio, erro: erroHoldings, recarregar: recarregarHoldings } = useAsyncData(obterPortfolio);
  const holdings = portfolio?.holdings.filter((holding) => holding.cotas > 0) ?? [];

  const carregar = useCallback(() => {
    recarregarListagens();
    recarregarHoldings();
  }, [recarregarListagens, recarregarHoldings]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-headline-lg-mobile font-bold tracking-tight sm:text-headline-lg">Mercado Secundário</h1>
        <CreateListingDialog holdings={holdings} listagens={listagens ?? []} onCriada={carregar} />
      </div>
      {erroHoldings ? <Alert tone="error" className="mb-4">{erroHoldings}</Alert> : null}
      {erroListagens ? (
        <Alert tone="error">{erroListagens}</Alert>
      ) : !listagens ? (
        <Spinner className="size-6" />
      ) : listagens.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">Nenhuma listagem ativa no momento.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listagens.map((listagem) => (
            <ListingCard key={listagem.id} listagem={listagem} onAtualizado={carregar} />
          ))}
        </div>
      )}
    </div>
  );
}
