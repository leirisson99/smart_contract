import { pathToFileURL } from "node:url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { config } from "./config.js";
import { authRoutes } from "./routes/auth.js";
import { investorRoutes } from "./routes/investors.js";
import { kycRoutes } from "./routes/kyc.js";
import { webhookRoutes } from "./routes/webhooks.js";
import { imoveisRoutes } from "./routes/imoveis.js";
import { portfolioRoutes } from "./routes/portfolio.js";
import { marketplaceRoutes } from "./routes/marketplace.js";
import { adminRoutes } from "./routes/admin.js";

export function buildServer() {
  const app = Fastify({ logger: true });
  // credentials:true NAO e necessario aqui - o cookie de sessao viaja via
  // proxy same-origin do Next.js (frontend/app/api/investor/[...path]/route.ts),
  // nunca via fetch cross-origin direto do browser (ver ADR-0007).
  app.register(cors, { origin: config.corsOrigin });
  app.register(cookie);
  // Default generoso (a maioria das rotas nao tem limite proprio); rotas
  // sensiveis a abuso de envio (ex. POST /auth/otp/solicitar) sobrescrevem
  // via `config.rateLimit` na propria definicao da rota.
  app.register(rateLimit, { global: false });
  app.register(authRoutes);
  app.register(investorRoutes);
  app.register(kycRoutes);
  app.register(webhookRoutes);
  app.register(imoveisRoutes);
  app.register(portfolioRoutes);
  app.register(marketplaceRoutes);
  app.register(adminRoutes);
  return app;
}

// pathToFileURL trata corretamente o drive letter do Windows (file:///C:/...);
// reconstruir a URL manualmente com template string (como antes) quebra
// silenciosamente nesse SO - import.meta.url nunca bate e o servidor nunca
// chama listen(), sem nenhum erro visivel.
const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  buildServer().listen({ port: config.port, host: "0.0.0.0" });
}
