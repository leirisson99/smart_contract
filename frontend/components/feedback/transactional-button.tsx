"use client";

import React from "react";
import { RiCheckLine, RiErrorWarningLine } from "@remixicon/react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export type TransactionState = "idle" | "processando" | "sucesso" | "erro";

interface TransactionalButtonProps extends Omit<ButtonProps, "isLoading"> {
  state: TransactionState;
  idleLabel: React.ReactNode;
  processingLabel?: React.ReactNode;
  successLabel?: React.ReactNode;
  errorLabel?: React.ReactNode;
}

/**
 * Botão para toda ação que dispara uma "transação" no backend (compra, claim, listagem).
 * Estados: idle -> processando -> sucesso/erro (RNF-15).
 */
function TransactionalButton({
  state,
  idleLabel,
  processingLabel = "Processando...",
  successLabel = "Concluído",
  errorLabel = "Tentar novamente",
  disabled,
  variant,
  ...props
}: TransactionalButtonProps) {
  const content: Record<TransactionState, React.ReactNode> = {
    idle: idleLabel,
    processando: (
      <>
        <Spinner />
        {processingLabel}
      </>
    ),
    sucesso: (
      <>
        <RiCheckLine className="size-4" aria-hidden="true" />
        {successLabel}
      </>
    ),
    erro: (
      <>
        <RiErrorWarningLine className="size-4" aria-hidden="true" />
        {errorLabel}
      </>
    ),
  };

  const resolvedVariant = state === "erro" ? "destructive" : variant;

  return (
    <Button
      variant={resolvedVariant}
      disabled={disabled || state === "processando" || state === "sucesso"}
      aria-live="polite"
      {...props}
    >
      {content[state]}
    </Button>
  );
}

export { TransactionalButton };
