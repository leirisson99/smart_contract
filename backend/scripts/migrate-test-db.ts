import { config } from "dotenv";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

/**
 * `pretest`: aplica as migrations no Postgres de teste (`.env.test`, servico
 * `postgres-test` do docker-compose.yml) antes de `vitest run` - sem isso o
 * primeiro `npm test` contra o banco novo falharia com "tabela nao existe".
 */
const root = resolve(import.meta.dirname, "..");
config({ path: resolve(root, ".env") });
config({ path: resolve(root, ".env.test"), override: true });

const resultado = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: true,
});
process.exit(resultado.status ?? 1);
