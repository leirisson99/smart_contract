import Fastify from "fastify";
import { config } from "./config.js";
import { investorRoutes } from "./routes/investors.js";
import { kycRoutes } from "./routes/kyc.js";
import { webhookRoutes } from "./routes/webhooks.js";
import { imoveisRoutes } from "./routes/imoveis.js";
import { portfolioRoutes } from "./routes/portfolio.js";

export function buildServer() {
  const app = Fastify({ logger: true });
  app.register(investorRoutes);
  app.register(kycRoutes);
  app.register(webhookRoutes);
  app.register(imoveisRoutes);
  app.register(portfolioRoutes);
  return app;
}

const isMain = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`;
if (isMain) {
  buildServer().listen({ port: config.port, host: "0.0.0.0" });
}
