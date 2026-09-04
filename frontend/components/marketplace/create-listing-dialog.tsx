"use client";

import { useMemo, useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { RiCloseLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { TransactionalButton } from "@/components/feedback/transactional-button";
import { useTransacao } from "@/components/feedback/use-transacao";
import { criarListagem } from "@/lib/api/marketplace";
import type { Holding, Listagem } from "@/lib/api/types";

interface CreateListingDialogProps {
  holdings: Holding[];
  listagens: Listagem[];
  onCriada: () => void;
}

function CreateListingDialog({ holdings, listagens, onCriada }: CreateListingDialogProps) {
  const [open, setOpen] = useState(false);
  // `null` ate o investidor escolher explicitamente - o holding selecionado
  // e sempre derivado na hora (com fallback pro primeiro), entao nunca fica
  // referenciando um imovelId que nao existe mais em `holdings`.
  const [imovelId, setImovelId] = useState<string | null>(null);
  const [cotas, setCotas] = useState(1);
  const [preco, setPreco] = useState(0);
  const { state, erro, executar } = useTransacao();

  const imovelSelecionado = useMemo(
    () => holdings.find((holding) => holding.imovelId === imovelId) ?? holdings[0],
    [holdings, imovelId],
  );
  const imovelIdSelecionado = imovelSelecionado?.imovelId ?? "";

  // Cotas do imovel que o investidor ja colocou a venda em outras listagens
  // ativas nao podem ser vendidas de novo - `Holding.cotas` reflete apenas o
  // saldo on-chain, sem descontar o que ja esta reservado em uma listagem.
  const { cotasJaListadas, cotasDisponiveis } = useMemo(() => {
    const jaListadas = listagens
      .filter((listagem) => listagem.criadaPeloUsuarioAtual && listagem.imovelId === imovelIdSelecionado)
      .reduce((soma, listagem) => soma + listagem.cotas, 0);
    return { cotasJaListadas: jaListadas, cotasDisponiveis: Math.max(0, (imovelSelecionado?.cotas ?? 0) - jaListadas) };
  }, [listagens, imovelIdSelecionado, imovelSelecionado]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!imovelSelecionado || cotas < 1 || cotas > cotasDisponiveis) return;
    executar(
      () => criarListagem(imovelSelecionado.imovelId, cotas, preco),
      () => {
        onCriada();
        setOpen(false);
      },
    );
  }

  if (holdings.length === 0) return null;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="secondary">Vender cotas</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-dialog-overlay-show" />
        <Dialog.Content className="fixed top-1/2 left-1/2 w-[min(420px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface-container-lowest p-6 shadow-card data-[state=open]:animate-dialog-content-show">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-title-md font-semibold">Criar listagem de venda</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Fechar" className="text-on-surface-variant hover:text-on-surface">
                <RiCloseLine className="size-5" />
              </button>
            </Dialog.Close>
          </div>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {erro ? <Alert tone="error">{erro}</Alert> : null}
            <div>
              <Label htmlFor="imovel">Imóvel</Label>
              <select
                id="imovel"
                className="block w-full min-h-12 rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md"
                value={imovelIdSelecionado}
                onChange={(event) => setImovelId(event.target.value)}
              >
                {holdings.map((holding) => (
                  <option key={holding.imovelId} value={holding.imovelId}>
                    {holding.imovelNome} ({holding.cotas} cotas)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="cotas">Quantidade de cotas</Label>
              <Input
                id="cotas"
                type="number"
                min={1}
                max={cotasDisponiveis || 1}
                step={1}
                value={cotas}
                onChange={(event) => setCotas(Math.floor(Number(event.target.value)))}
              />
              <p className="mt-1 text-mono-label text-on-surface-variant">
                {cotasDisponiveis} {cotasDisponiveis === 1 ? "cota disponível" : "cotas disponíveis"} para venda
                {cotasJaListadas > 0 ? ` (${cotasJaListadas} já em outra listagem)` : ""}
              </p>
            </div>
            <div>
              <Label htmlFor="preco">Preço por cota (R$)</Label>
              <Input
                id="preco"
                type="number"
                min={1}
                value={preco}
                onChange={(event) => setPreco(Number(event.target.value))}
              />
            </div>
            <TransactionalButton
              state={state}
              idleLabel="Publicar listagem"
              type="submit"
              className="w-full"
              disabled={cotasDisponiveis === 0}
            />
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { CreateListingDialog };
