import { StatusChip } from "@/components/ui/status-chip";
import type { StatusImovel } from "@/lib/api/types";

const CONFIG: Record<StatusImovel, { label: string; tone: "success" | "neutral" | "info" }> = {
  em_captacao: { label: "Em Captação", tone: "success" },
  vendido: { label: "Vendido", tone: "neutral" },
  alugado: { label: "Alugado", tone: "info" },
};

function PropertyStatusChip({ status }: { status: StatusImovel }) {
  const { label, tone } = CONFIG[status];
  return <StatusChip tone={tone}>{label}</StatusChip>;
}

export { PropertyStatusChip };
