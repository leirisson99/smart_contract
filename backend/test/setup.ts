import { config } from "dotenv";
import { resolve } from "node:path";

// Mesma base de `.env` (RPC_URL, enderecos deployados, chaves de teste) usada
// pelo dev server, com `.env.test` sobrescrevendo so o Postgres - ver
// backend/.env.test(.example) e o servico `postgres-test` do docker-compose.
const root = resolve(import.meta.dirname, "..");
config({ path: resolve(root, ".env") });
config({ path: resolve(root, ".env.test"), override: true });
