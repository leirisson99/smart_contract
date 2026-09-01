import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 20000,
    hookTimeout: 20000,
    setupFiles: ["dotenv/config"],
    // Os testes usam um Postgres e (no e2e) um Anvil reais e compartilhados.
    // Rodar arquivos em paralelo causa corrida entre o cleanup de um arquivo
    // (deleteMany) e o fluxo assincrono do webhook mock de outro.
    fileParallelism: false,
  },
});
