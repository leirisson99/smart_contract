import Link from "next/link";
import { RiCheckboxCircleFill } from "@remixicon/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";

interface PurchaseSuccessPanelProps {
  imovelNome: string;
  cotas: number;
  valorInvestido: number;
}

function PurchaseSuccessPanel({ imovelNome, cotas, valorInvestido }: PurchaseSuccessPanelProps) {
  return (
    <Card>
      <CardHeader className="items-center text-center">
        <RiCheckboxCircleFill className="size-12 text-secondary" aria-hidden="true" />
        <CardTitle>Compra concluída</CardTitle>
        <CardDescription>
          Você investiu {formatCurrency(valorInvestido)} em {cotas} {cotas === 1 ? "cota" : "cotas"} de {imovelNome}.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-label-sm text-on-surface-variant">
        As novas cotas já aparecem no seu portfólio.
      </CardContent>
      <CardFooter className="justify-center">
        <Button asChild>
          <Link href="/portfolio">Ver meu portfólio</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export { PurchaseSuccessPanel };
