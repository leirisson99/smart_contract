---
status: draft
owner: tech-lead
last_updated: 2026-09-01
---

# Tasks — Feature Backend 004

1. [ ] Implementar endpoint de listagem de cotas para venda, assinando `Marketplace.listar` (RF-34; depende de `../../../on-chain/features/004-mercado-secundario` concluída).
2. [ ] Implementar endpoint de compra no mercado secundário, assinando `Marketplace.comprar` (RF-35), com checagem otimista de KYC antes do envio.
3. [ ] Testes de integração e end-to-end (listagem → compra por outro investidor → saldo atualizado em ambos os portfólios).
4. [ ] Revisão de segurança (RNF-16, ver [002](../002-investimento-primario/tasks.md) — o backend nunca é a última linha de defesa).
