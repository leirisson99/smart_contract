import { pathToFileURL } from "node:url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { investorRoutes } from "./routes/investors.js";
import { kycRoutes } from "./routes/kyc.js";
import { webhookRoutes } from "./routes/webhooks.js";
import { imoveisRoutes } from "./routes/imoveis.js";
import { portfolioRoutes } from "./routes/portfolio.js";
import { marketplaceRoutes } from "./routes/marketplace.js";

export function buildServer() {
  const app = Fastify({ logger: true });
  app.register(cors, { origin: config.corsOrigin });
  app.register(investorRoutes);
  app.register(kycRoutes);
  app.register(webhookRoutes);
  app.register(imoveisRoutes);
  app.register(portfolioRoutes);
  app.register(marketplaceRoutes);
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
