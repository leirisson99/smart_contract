---
status: draft
owner: tech-lead
last_updated: 2026-09-01
---

# Referência para Design System — Frontend

> Este documento **não** é o design system. É a referência que um agente deve consultar antes de propor tokens, componentes e telas para `frontend/`. Reúne o que já está decidido (produto, requisitos, stack) e sinaliza o que ainda é decisão em aberto (paleta, tipografia, tom visual final).

## Objetivo do produto em uma frase
Permitir que um investidor de varejo **sem conhecimento técnico de blockchain** compre cotas digitais de um imóvel, acompanhe rendimentos de aluguel e revenda cotas no mercado secundário — sem nunca precisar entender carteira, gas ou contrato.

Fonte completa de requisitos: [`features/001-interface-investidor/spec.md`](features/001-interface-investidor/spec.md) (RF-27 a RF-32, RNF-12 a RNF-15) e [`plan.md`](features/001-interface-investidor/plan.md).

## Personas
| Persona | Usa a interface para |
|---|---|
| Investidor | Cadastro/KYC, compra de cotas, acompanhar portfólio e rendimentos, negociar no mercado secundário |
| Gestor da SPE / administrador | Criar imóvel, depositar rendimento mensal, acompanhar status de KYC dos investidores |

## Princípios de design obrigatórios (derivados dos RNFs — não negociáveis)
- **Esconder o on-chain (RNF-12)**: nenhuma tela da jornada principal mostra endereço de contrato, hash de transação ou gas. Esses dados só existem numa seção avançada/opcional.
- **Mobile-first (RNF-13)**: investidor de varejo acessa majoritariamente pelo celular — desenhar para mobile primeiro, expandir para desktop.
- **Acessibilidade WCAG AA (RNF-14)**: contraste e navegação por teclado são requisito, não bônus — a interface lida com decisões financeiras.
- **Feedback de processamento (RNF-15)**: toda ação que dispara transação on-chain (compra, claim, criar listagem) precisa de estado visual imediato de "processando", já que a confirmação não é instantânea. Todo componente transacional precisa de estados `idle → processando → sucesso/erro`.
- **Erros traduzidos (RF-32)**: mensagens de erro do backend/contrato (ex.: "sem KYC", "cotas insuficientes", "listagem já vendida") chegam à interface já traduzidas para linguagem não-técnica — o design precisa de um padrão visual único para esse tipo de alerta.

## Tom e direção visual (ponto de partida — validar antes de fechar tokens de marca)
Público é investidor de varejo brasileiro, muitas vezes de primeira viagem tanto em investimentos quanto em cripto. O tom deve transmitir **solidez financeira e confiança** (fintech/corretora regulada), evitando estética "crypto" (neon, gradientes cyberpunk, jargão de blockchain). Pensar em referências como fintechs/corretoras brasileiras de investimento, adaptado a produto imobiliário — profissional, direto, acolhedor para quem nunca investiu.

Isso é uma sugestão inicial, não uma decisão fechada — confirmar com o usuário antes de travar paleta/tipografia definitivas.

## Stack técnico já decidido (restrições, não escolhas do design system)
- Next.js App Router (`frontend/app`)
- shadcn/ui **sobre Base UI** (não Radix puro) — o projeto já tem a skill `migrate-radix-to-base` em `frontend/.agents/skills/`, sinal de que a base de componentes é Base UI + Tailwind
- Tailwind CSS
- Idioma pt-BR; moeda BRL (R$); formatos de número/data em pt-BR

## Inventário de telas e estados (fonte: cenários de aceite da spec)
1. **Cadastro e KYC** — formulário + upload de documentos; status `pendente / aprovado / reprovado`, atualizado de forma assíncrona sem ação do usuário
2. **Imóvel disponível** — valor total, cotas restantes, preço por cota, rendimento estimado; seleção de quantidade e confirmação de compra; estado "processando" até confirmação
3. **Portfólio do investidor** — cotas por imóvel, valor investido, histórico de rendimentos recebidos, rendimentos pendentes de claim
4. **Painel do gestor** — form de criar imóvel, form de depositar rendimento mensal, lista de investidores com status de KYC
5. **Mercado secundário** — listagens ativas, criar listagem de venda, comprar listagem existente, cancelar listagem própria
6. **Erro traduzido** — padrão único de alerta para mensagens de erro não-técnicas

## Componentes prováveis (a confirmar na etapa de design system)
- Badge de status (KYC: pendente/aprovado/reprovado; listagem: ativa/vendida/cancelada)
- Card de imóvel (progresso de cotas vendidas, preço/cota, rendimento estimado)
- Formulário multi-step (cadastro + upload de documento)
- Lista/tabela de portfólio com estados vazio / carregando / erro
- Botão transacional com estado `idle/processando/sucesso/erro`, reutilizável em toda ação que envolve o backend
- Alert/toast de erro traduzido (visualmente distinto de erro técnico)
- Forms administrativos (criar imóvel, depositar rendimento)
- Tabela de investidores do painel do gestor, com filtro por status de KYC

## Fora de escopo deste documento
- Paleta de cores, tipografia e tokens numéricos finais
- Wireframes de alta fidelidade
- Qualquer lógica de negócio ou validação (vive em `backend/features` e `on-chain/features` — o frontend só reflete o resultado, nunca decide)

## Referências
- [`features/001-interface-investidor/spec.md`](features/001-interface-investidor/spec.md)
- [`features/001-interface-investidor/plan.md`](features/001-interface-investidor/plan.md)
- `frontend/.agents/skills/shadcn/`, `frontend/.agents/skills/migrate-radix-to-base/`
- [`../on-chain/00-constitution.md`](../on-chain/00-constitution.md)
