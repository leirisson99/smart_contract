"use client";

import { PropertyCard } from "@/components/property/property-card";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { listarImoveis } from "@/lib/api/imoveis";
import { useAsyncData } from "@/lib/hooks/use-async-data";

export default function ImoveisPage() {
  const { data: imoveis, erro } = useAsyncData(listarImoveis);

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
