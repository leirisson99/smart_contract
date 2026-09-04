import type { StatusChipTone } from "@/components/ui/status-chip";
import type { StatusKyc } from "@/lib/api/types";

/** Cor do StatusChip por status de KYC — reusado por toda tela que exibe esse status. */
export const KYC_STATUS_TONE: Record<StatusKyc, StatusChipTone> = {
  pendente: "warning",
  aprovado: "success",
  reprovado: "error",
};
