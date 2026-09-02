import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { Holding } from "@/lib/api/types";

function HoldingsTable({ holdings }: { holdings: Holding[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Minhas cotas</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-0">
        {holdings.length === 0 ? (
          <p className="p-6 text-body-md text-on-surface-variant">Você ainda não possui cotas de nenhum imóvel.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body-md">
              <thead>
                <tr className="border-b border-outline-variant text-left text-label-sm text-on-surface-variant">
                  <th className="px-4 py-2 sm:px-6">Imóvel</th>
                  <th className="px-4 py-2 text-right sm:px-6">Cotas</th>
                  <th className="px-4 py-2 text-right sm:px-6">Valor investido</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => (
                  <tr key={holding.imovelId} className="border-b border-outline-variant last:border-0">
                    <td className="px-4 py-3 font-medium sm:px-6">{holding.imovelNome}</td>
                    <td className="px-4 py-3 text-right sm:px-6">{holding.cotas}</td>
                    <td className="px-4 py-3 text-right sm:px-6">{formatCurrency(holding.valorInvestido)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { HoldingsTable };
