"use client";

import { useState, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { TransactionalButton, type TransactionState } from "@/components/feedback/transactional-button";
import { criarImovel } from "@/lib/api/admin";
import { traduzirErro } from "@/lib/errors";

function CreatePropertyForm({ onCriado }: { onCriado: () => void }) {
  const [nome, setNome] = useState("");
  const [imagemUrl, setImagemUrl] = useState(
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=800&auto=format&fit=crop",
  );
  const [valorTotal, setValorTotal] = useState(1_000_000);
  const [totalCotas, setTotalCotas] = useState(100);
  const [rendimento, setRendimento] = useState(0.08);
  const [state, setState] = useState<TransactionState>("idle");
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setState("processando");
    setErro(null);
    try {
      await criarImovel({ nome, imagemUrl, valorTotal, totalCotas, rendimentoEstimadoAnual: rendimento });
      setState("sucesso");
      setNome("");
      onCriado();
      setTimeout(() => setState("idle"), 1500);
    } catch (error) {
      setState("erro");
      setErro(traduzirErro(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar novo imóvel</CardTitle>
        <CardDescription>Divide o imóvel em cotas e o disponibiliza para captação.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          {erro ? <Alert tone="error" className="sm:col-span-2">{erro}</Alert> : null}
          <div className="sm:col-span-2">
            <Label htmlFor="nome-imovel">Nome do imóvel</Label>
            <Input id="nome-imovel" required value={nome} onChange={(event) => setNome(event.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="imagem-imovel">URL da imagem</Label>
            <Input
              id="imagem-imovel"
              type="url"
              required
              value={imagemUrl}
              onChange={(event) => setImagemUrl(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="valor-total">Valor total (R$)</Label>
            <Input
              id="valor-total"
              type="number"
              min={1}
              value={valorTotal}
              onChange={(event) => setValorTotal(Number(event.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="total-cotas">Número de cotas</Label>
            <Input
              id="total-cotas"
              type="number"
              min={1}
              value={totalCotas}
              onChange={(event) => setTotalCotas(Number(event.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="rendimento">Rendimento anual estimado (%)</Label>
            <Input
              id="rendimento"
              type="number"
              step={0.1}
              min={0}
              value={rendimento * 100}
              onChange={(event) => setRendimento(Number(event.target.value) / 100)}
            />
          </div>
          <div className="flex items-end sm:col-span-2">
            <TransactionalButton state={state} idleLabel="Criar imóvel" type="submit" />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export { CreatePropertyForm };
