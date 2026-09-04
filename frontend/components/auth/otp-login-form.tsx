"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { TransactionalButton } from "@/components/feedback/transactional-button";
import { useTransacao } from "@/components/feedback/use-transacao";
import { solicitarCodigo, verificarCodigo } from "@/lib/api/auth";

/**
 * Login sem senha (feature 006-autenticacao-investidor): dois passos,
 * e-mail -> código HOTP recebido por e-mail. Substitui o "login automático"
 * do cadastro (`localStorage`) para quem já tem conta e volta em outro
 * dispositivo/navegador ou depois de limpar os dados do site.
 */
function OtpLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [etapa, setEtapa] = useState<"email" | "codigo">("email");
  const solicitar = useTransacao();
  const verificar = useTransacao();

  function handleSolicitar(event: FormEvent) {
    event.preventDefault();
    solicitar.executar(
      () => solicitarCodigo(email),
      () => setEtapa("codigo"),
    );
  }

  function handleVerificar(event: FormEvent) {
    event.preventDefault();
    verificar.executar(
      () => verificarCodigo(email, codigo),
      () => {
        router.push(searchParams.get("next") ?? "/imoveis");
        router.refresh();
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>
          {etapa === "email"
            ? "Informe o e-mail do seu cadastro para receber um código de acesso."
            : `Enviamos um código para ${email}. Ele vale por 5 minutos.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {etapa === "email" ? (
          <form className="flex flex-col gap-4" onSubmit={handleSolicitar}>
            {solicitar.erro ? <Alert tone="error">{solicitar.erro}</Alert> : null}
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <TransactionalButton
              type="submit"
              state={solicitar.state}
              idleLabel="Enviar código"
              processingLabel="Enviando..."
              className="w-full"
            />
          </form>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleVerificar}>
            {verificar.erro ? <Alert tone="error">{verificar.erro}</Alert> : null}
            <div>
              <Label htmlFor="codigo">Código de acesso</Label>
              <Input
                id="codigo"
                inputMode="numeric"
                autoFocus
                required
                value={codigo}
                onChange={(event) => setCodigo(event.target.value)}
              />
            </div>
            <TransactionalButton
              type="submit"
              state={verificar.state}
              idleLabel="Entrar"
              processingLabel="Verificando..."
              className="w-full"
            />
            <button
              type="button"
              className="text-label-sm text-on-surface-variant underline underline-offset-2"
              onClick={() => setEtapa("email")}
            >
              Usar outro e-mail
            </button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export { OtpLoginForm };
