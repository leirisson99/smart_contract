"use client";

import { useState } from "react";
import { traduzirErro } from "@/lib/errors";
import type { TransactionState } from "./transactional-button";

/**
 * Estado idle -> processando -> sucesso/erro (RNF-15) por trás de todo
 * `TransactionalButton`. `onSucesso` roda antes do reset para idle, para que
 * o chamador possa reagir (fechar modal, disparar refetch, etc).
 */
function useTransacao() {
  const [state, setState] = useState<TransactionState>("idle");
  const [erro, setErro] = useState<string | null>(null);

  async function executar(acao: () => Promise<unknown>, onSucesso?: () => void): Promise<void> {
    setState("processando");
    setErro(null);
    try {
      await acao();
      setState("sucesso");
      onSucesso?.();
      setTimeout(() => setState("idle"), 1500);
    } catch (error) {
      setState("erro");
      setErro(traduzirErro(error));
    }
  }

  return { state, erro, executar };
}

export { useTransacao };
