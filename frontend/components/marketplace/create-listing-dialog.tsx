"use client";

import { useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { RiCloseLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { TransactionalButton, type TransactionState } from "@/components/feedback/transactional-button";
import { criarListagem } from "@/lib/api/marketplace";
import { traduzirErro } from "@/lib/errors";
import type { Holding } from "@/lib/api/types";

interface CreateListingDialogProps {
  holdings: Holding[];
  onCriada: () => void;
}

function CreateListingDialog({ holdings, onCriada }: CreateListingDialogProps) {
  const [open, setOpen] = useState(false);
  const [imovelId, setImovelId] = useState(holdings[0]?.imovelId ?? "");
  const [cotas, setCotas] = useState(1);
  const [preco, setPreco] = useState(0);
  const [state, setState] = useState<TransactionState>("idle");
  const [erro, setErro] = useState<string | null>(null);

  // `holdings` chega assíncrono (obterPortfolio); o valor inicial de
  // `imovelId` captura o array vazio do primeiro render e nunca mais
  // atualiza sozinho, deixando `imovelSelecionado` indefinido mesmo depois
  // que os holdings chegam - por isso cai para o primeiro holding aqui, em
  // vez de confiar cegamente no `imovelId` armazenado.
  const imovelIdEfetivo = holdings.some((holding) => holding.imovelId === imovelId)
    ? imovelId
    : (holdings[0]?.imovelId ?? "");
  const imovelSelecionado = holdings.find((item) => item.imovelId === imovelIdEfetivo);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!imovelSelecionado) return;
    setState("processando");
    setErro(null);
    try {
      await criarListagem(imovelSelecionado.imovelId, cotas, preco);
      setState("sucesso");
      onCriada();
      setOpen(false);
      setState("idle");
    } catch (error) {
      setState("erro");
      setErro(traduzirErro(error));
    }
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
                value={imovelIdEfetivo}
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
                max={imovelSelecionado?.cotas ?? 1}
                value={cotas}
                onChange={(event) => setCotas(Number(event.target.value))}
              />
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
            <TransactionalButton state={state} idleLabel="Publicar listagem" type="submit" className="w-full" />
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { CreateListingDialog };
