import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import type { RendimentoRecebido } from "@/lib/api/types";

function YieldHistoryList({ rendimentos }: { rendimentos: RendimentoRecebido[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de rendimentos</CardTitle>
      </CardHeader>
      <CardContent>
        {rendimentos.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">Nenhum rendimento recebido ainda.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-outline-variant">
            {rendimentos.map((rendimento) => (
              <li key={rendimento.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{rendimento.imovelNome}</p>
                  <p className="text-label-sm text-on-surface-variant">
                    Ciclo {rendimento.cicloReferencia} · recebido em {formatDate(rendimento.dataRecebimento)}
                  </p>
                </div>
                <p className="font-semibold text-secondary">{formatCurrency(rendimento.valor)}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { YieldHistoryList };
