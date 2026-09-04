"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { TransactionalButton } from "@/components/feedback/transactional-button";
import { useTransacao } from "@/components/feedback/use-transacao";
import { DocumentUploadField } from "./document-upload-field";
import { KycStatusCard } from "./kyc-status-card";
import { cadastrar, obterStatusKyc } from "@/lib/api/kyc";
import { traduzirErro } from "@/lib/errors";
import type { StatusKyc } from "@/lib/api/types";

function KycForm() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [documento, setDocumento] = useState<File | null>(null);
  const { state, erro, executar } = useTransacao();
  const [status, setStatus] = useState<StatusKyc | null>(null);
  const [erroPolling, setErroPolling] = useState<string | null>(null);

  useEffect(() => {
    if (!status || status === "aprovado" || status === "reprovado") return;
    const interval = setInterval(async () => {
      try {
        const atual = await obterStatusKyc();
        setStatus(atual);
        setErroPolling(null);
      } catch (error) {
        setErroPolling(traduzirErro(error));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [status]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    executar(async () => {
      const investidor = await cadastrar({ nome, email, cpf });
      setStatus(investidor.statusKyc);
    });
  }

  if (status) {
    return <KycStatusCard status={status} avisoErro={erroPolling} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastro e verificação de identidade</CardTitle>
        <CardDescription>
          Precisamos confirmar sua identidade antes de você investir — é rápido e só precisa ser feito uma vez.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {erro ? <Alert tone="error">{erro}</Alert> : null}
          <div>
            <Label htmlFor="nome">Nome completo</Label>
            <Input id="nome" required value={nome} onChange={(event) => setNome(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              required
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(event) => setCpf(event.target.value)}
            />
          </div>
          <DocumentUploadField
            id="documento"
            label="Documento com foto (RG ou CNH)"
            hint="Formatos aceitos: JPG, PNG ou PDF."
            onChange={setDocumento}
          />
          <TransactionalButton
            type="submit"
            state={state}
            idleLabel="Enviar cadastro"
            processingLabel="Enviando documentos..."
            disabled={!documento}
            className="w-full"
          />
        </form>
      </CardContent>
    </Card>
  );
}

export { KycForm };
