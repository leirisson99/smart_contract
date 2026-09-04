---
status: draft
owner: tech-lead
last_updated: 2026-08-17
---

# Tasks — Feature Frontend 001

1. [ ] Definir stack de frontend e biblioteca de cliente de API (decisão técnica a registrar, se relevante, como ADR).
2. [ ] Implementar tela de cadastro e upload de KYC com exibição de status (RF-27).
3. [ ] Implementar tela do imóvel — exibição de dados e fluxo de compra (RF-28).
4. [ ] Implementar tela de portfólio (RF-29).
5. [ ] Implementar painel do gestor — criação de imóvel, depósito de rendimento, status de KYC (RF-30).
6. [ ] Implementar telas de mercado secundário — listagem e compra (RF-31).
7. [ ] Implementar camada de tradução de erros do backend em mensagens amigáveis (RF-32).
8. [ ] Testes de componente e end-to-end conforme `test-strategy.md` (depende do backend, `../../../backend/features`, com endpoints disponíveis).
9. [ ] Revisão de acessibilidade e responsividade nas telas principais.
10. [x] Implementar tela de login sem senha (`/entrar`, RF-40) e guarda de rota para áreas que exigem sessão (`frontend/middleware.ts`) — depende de `../../../backend/features/006-autenticacao-investidor` concluída. `frontend/app/entrar/page.tsx` + `frontend/components/auth/otp-login-form.tsx` (formulário de 2 passos), `frontend/lib/api/auth.ts` (`solicitarCodigo`/`verificarCodigo`/`obterSessaoAtual`/`logout`), proxy same-origin `frontend/app/api/investor/[...path]/route.ts` para o cookie de sessão nunca ser cross-origin. `frontend/lib/api/session.ts` (localStorage fake, dívida original) removido. Verificado ponta a ponta via Playwright headless em 2026-09-04.
