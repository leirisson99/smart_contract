import { RiCheckboxCircleLine, RiCloseCircleLine, RiTimeLine } from "@remixicon/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { Alert } from "@/components/ui/alert";
import { KYC_STATUS_TONE } from "./kyc-status";
import type { StatusKyc } from "@/lib/api/types";

const CONFIG: Record<StatusKyc, { label: string; icon: typeof RiTimeLine; descricao: string }> = {
  pendente: {
    label: "Em análise",
    icon: RiTimeLine,
    descricao: "Estamos analisando seus documentos. Isso costuma levar alguns minutos — você não precisa fazer nada.",
  },
  aprovado: {
    label: "Aprovado",
    icon: RiCheckboxCircleLine,
    descricao: "Sua identidade foi verificada. Você já pode investir nos imóveis disponíveis.",
  },
  reprovado: {
    label: "Reprovado",
    icon: RiCloseCircleLine,
    descricao: "Não conseguimos verificar sua identidade com os documentos enviados. Entre em contato com o suporte.",
  },
};

function KycStatusCard({ status, avisoErro }: { status: StatusKyc; avisoErro?: string | null }) {
  const { label, icon: Icon, descricao } = CONFIG[status];
  const tone = KYC_STATUS_TONE[status];
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
      <CardContent className="flex flex-col gap-3">
        <CardDescription>{descricao}</CardDescription>
        {avisoErro ? (
          <Alert tone="info">Não conseguimos atualizar o status agora ({avisoErro}). Vamos continuar tentando.</Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}

export { KycStatusCard };
