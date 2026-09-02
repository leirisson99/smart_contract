import { runYieldClaimJob } from "../src/services/yieldClaimJob.js";

/**
 * Entry point do job periodico de claim automatico (RF-24). Nao inclui
 * scheduling proprio (cron/setInterval) de proposito - a POC roda isto via
 * um agendador externo (cron do sistema, tarefa agendada, etc.), mantendo o
 * backend simples (ver "Simplicidade no MVP" em on-chain/00-constitution.md).
 */
async function main() {
  const result = await runYieldClaimJob();
  console.log(
    `Job de claim automatico concluido: ${result.investidoresProcessados} investidor(es) processado(s), ${result.claimsExecutados} claim(s) executado(s).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
