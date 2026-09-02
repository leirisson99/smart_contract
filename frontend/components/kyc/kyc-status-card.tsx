import { RiCheckboxCircleLine, RiCloseCircleLine, RiTimeLine } from "@remixicon/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import type { StatusKyc } from "@/lib/api/types";

const CONFIG: Record<StatusKyc, { label: string; tone: "warning" | "success" | "error"; icon: typeof RiTimeLine; descricao: string }> = {
  pendente: {
    label: "Em análise",
    tone: "warning",
    icon: RiTimeLine,
    descricao: "Estamos analisando seus documentos. Isso costuma levar alguns minutos — você não precisa fazer nada.",
  },
  aprovado: {
    label: "Aprovado",
    tone: "success",
    icon: RiCheckboxCircleLine,
    descricao: "Sua identidade foi verificada. Você já pode investir nos imóveis disponíveis.",
  },
  reprovado: {
    label: "Reprovado",
    tone: "error",
    icon: RiCloseCircleLine,
    descricao: "Não conseguimos verificar sua identidade com os documentos enviados. Entre em contato com o suporte.",
  },
};

function KycStatusCard({ status }: { status: StatusKyc }) {
  const { label, tone, icon: Icon, descricao } = CONFIG[status];
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="size-5 text-on-surface-variant" aria-hidden="true" />
          <CardTitle>Status da verificação (KYC)</CardTitle>
        </div>
        <StatusChip tone={tone} className="w-fit">
          {label}
        </StatusChip>
      </CardHeader>
      <CardContent>
        <CardDescription>{descricao}</CardDescription>
      </CardContent>
    </Card>
  );
}

export { KycStatusCard };
