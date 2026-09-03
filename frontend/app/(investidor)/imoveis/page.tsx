"use client";

import { useEffect, useState } from "react";
import { PropertyCard } from "@/components/property/property-card";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { listarImoveis } from "@/lib/api/imoveis";
import type { Imovel } from "@/lib/api/types";
import { traduzirErro } from "@/lib/errors";

export default function ImoveisPage() {
  const [imoveis, setImoveis] = useState<Imovel[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarImoveis()
      .then(setImoveis)
      .catch((error) => setErro(traduzirErro(error)));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-headline-lg-mobile font-bold tracking-tight sm:text-headline-lg">Imóveis Disponíveis</h1>
      {erro ? (
        <Alert tone="error">{erro}</Alert>
      ) : !imoveis ? (
        <Spinner className="size-6" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {imoveis.map((imovel) => (
            <PropertyCard key={imovel.id} imovel={imovel} />
          ))}
        </div>
      )}
    </div>
  );
}
