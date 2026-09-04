import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    /** Setado por `middleware/investorAuth.ts#exigirInvestidor` a partir do cookie de sessao - nunca confiar num campo equivalente vindo do body/query/params. */
    investorId?: string;
  }
}
