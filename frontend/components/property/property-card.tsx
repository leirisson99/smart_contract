import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { PropertyStatusChip } from "./property-status-chip";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { Imovel } from "@/lib/api/types";

function PropertyCard({ imovel }: { imovel: Imovel }) {
  const cotasVendidas = imovel.totalCotas - imovel.cotasRestantes;
  const percentualVendido = imovel.totalCotas > 0 ? (cotasVendidas / imovel.totalCotas) * 100 : 0;

  return (
    <Link href={`/imoveis/${imovel.id}`} className="block">
      <Card className="h-full transition-shadow hover:shadow-lg">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
          <Image src={imovel.imagemUrl} alt={imovel.nome} fill sizes="(min-width: 640px) 33vw, 100vw" className="object-cover" />
        </div>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle>{imovel.nome}</CardTitle>
            <PropertyStatusChip status={imovel.status} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between text-body-md">
            <span className="text-on-surface-variant">Rendimento estimado</span>
            <span className="font-semibold text-secondary">{formatPercent(imovel.rendimentoEstimadoAnual)} a.a.</span>
          </div>
          <div className="flex items-baseline justify-between text-body-md">
            <span className="text-on-surface-variant">Valor mínimo</span>
            <span className="font-semibold">{formatCurrency(imovel.valorMinimoInvestimento)}</span>
          </div>
          <div>
            <ProgressBar value={percentualVendido} />
            <p className="mt-1 text-mono-label text-on-surface-variant">
              {cotasVendidas} de {imovel.totalCotas} cotas vendidas
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export { PropertyCard };
