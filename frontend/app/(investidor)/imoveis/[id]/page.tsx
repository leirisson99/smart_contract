"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { PropertyPurchasePanel } from "@/components/property/property-purchase-panel";
import { PropertyStatusChip } from "@/components/property/property-status-chip";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { obterImovel } from "@/lib/api/imoveis";
import { formatCurrency, formatPercent } from "@/lib/format";
import { traduzirErro } from "@/lib/errors";
import type { Imovel } from "@/lib/api/types";

export default function DetalhesImovelPage() {
  const params = useParams<{ id: string }>();
  const [imovel, setImovel] = useState<Imovel | null | undefined>(undefined);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    obterImovel(params.id)
      .then(setImovel)
      .catch((error) => setErro(traduzirErro(error)));
  }, [params.id]);

  if (erro) return <Alert tone="error">{erro}</Alert>;
  if (imovel === undefined) return <Spinner className="size-6" />;
  if (imovel === null) notFound();

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <Image src={imovel.imagemUrl} alt={imovel.nome} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
        </div>
        <div className="mt-4 flex items-start justify-between gap-2">
          <h1 className="text-headline-lg-mobile font-bold tracking-tight sm:text-headline-lg">{imovel.nome}</h1>
          <PropertyStatusChip status={imovel.status} />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-label-sm text-on-surface-variant">Valor total</dt>
            <dd className="text-title-md font-semibold">{formatCurrency(imovel.valorTotal)}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-on-surface-variant">Preço/cota</dt>
            <dd className="text-title-md font-semibold">{formatCurrency(imovel.precoPorCota)}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-on-surface-variant">Cotas restantes</dt>
            <dd className="text-title-md font-semibold">{imovel.cotasRestantes}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-on-surface-variant">Rendimento estimado</dt>
            <dd className="text-title-md font-semibold text-secondary">{formatPercent(imovel.rendimentoEstimadoAnual)} a.a.</dd>
          </div>
        </dl>
      </div>
      <div>
        <PropertyPurchasePanel imovel={imovel} />
      </div>
    </div>
  );
}
