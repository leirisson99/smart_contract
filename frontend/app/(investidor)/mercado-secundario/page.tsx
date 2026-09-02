"use client";

import { useCallback, useEffect, useState } from "react";
import { ListingCard } from "@/components/marketplace/listing-card";
import { CreateListingDialog } from "@/components/marketplace/create-listing-dialog";
import { Spinner } from "@/components/ui/spinner";
import { listarListagens } from "@/lib/api/marketplace";
import { obterPortfolio } from "@/lib/api/portfolio";
import type { Listagem, Holding } from "@/lib/api/types";

export default function MercadoSecundarioPage() {
  const [listagens, setListagens] = useState<Listagem[] | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);

  const carregar = useCallback(() => {
    listarListagens().then(setListagens);
    obterPortfolio().then((portfolio) => setHoldings(portfolio.holdings.filter((holding) => holding.cotas > 0)));
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-headline-lg-mobile font-bold tracking-tight sm:text-headline-lg">Mercado Secundário</h1>
        <CreateListingDialog holdings={holdings} onCriada={carregar} />
      </div>
      {!listagens ? (
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
