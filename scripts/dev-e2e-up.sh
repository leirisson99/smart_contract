#!/usr/bin/env bash
# Sobe uma Anvil local do zero, deploya toda a infra on-chain necessaria para
# o fluxo cadastro -> KYC -> compra -> portfolio -> resgate de rendimento
# funcionar de ponta a ponta, e atualiza backend/.env + a tabela Property com
# os enderecos novos. Anvil nao persiste estado entre reinicios, entao isso
# precisa rodar de novo toda vez que a Anvil for reiniciada.
#
# Pre-requisitos: Foundry instalado, Postgres do backend/docker-compose.yml
# rodando, backend/.env ja existente (so os valores de endereco/porta sao
# reescritos aqui).
#
# Uso: bash scripts/dev-e2e-up.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTRACTS_DIR="$REPO_ROOT/projeto_imobiliaria"
BACKEND_DIR="$REPO_ROOT/backend"
BACKEND_ENV="$BACKEND_DIR/.env"

# Conta #0 padrao da Anvil (mnemonic determinístico default) - so dev local.
DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RPC_URL=http://127.0.0.1:8545

echo "== subindo Anvil =="
anvil > /tmp/anvil-dev-e2e.log 2>&1 &
ANVIL_PID=$!
echo "Anvil PID $ANVIL_PID (log em /tmp/anvil-dev-e2e.log)"
for i in $(seq 1 20); do
  curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' "$RPC_URL" > /dev/null 2>&1 && break
  sleep 0.5
done

echo "== deploy IdentityRegistry + ComplianceModule =="
cd "$CONTRACTS_DIR"
OUT1=$(PRIVATE_KEY=$DEPLOYER_PRIVATE_KEY forge script script/DeployIdentityKyc.s.sol --rpc-url "$RPC_URL" --broadcast)
IDENTITY_REGISTRY_ADDRESS=$(echo "$OUT1" | grep "IdentityRegistry:" | awk '{print $2}')
COMPLIANCE_MODULE_ADDRESS=$(echo "$OUT1" | grep "ComplianceModule:" | awk '{print $2}')
echo "IdentityRegistry=$IDENTITY_REGISTRY_ADDRESS ComplianceModule=$COMPLIANCE_MODULE_ADDRESS"

echo "== atualizando backend/.env (IDENTITY_REGISTRY_ADDRESS, PORT) =="
sed -i "s|^IDENTITY_REGISTRY_ADDRESS=.*|IDENTITY_REGISTRY_ADDRESS=\"$IDENTITY_REGISTRY_ADDRESS\"|" "$BACKEND_ENV"
sed -i 's|^PORT=.*|PORT="3333"|' "$BACKEND_ENV"
sed -i "s|^GESTOR_PRIVATE_KEY=.*|GESTOR_PRIVATE_KEY=\"$DEPLOYER_PRIVATE_KEY\"|" "$BACKEND_ENV"

echo "== registrando o backend como Trusted Issuer =="
cd "$BACKEND_DIR"
npm run grant-trusted-issuer

echo "== deploy MockERC20 + PropertyFactory + imovel de exemplo + DividendDistributor =="
cd "$CONTRACTS_DIR"
OUT2=$(PRIVATE_KEY=$DEPLOYER_PRIVATE_KEY \
  IDENTITY_REGISTRY_ADDRESS=$IDENTITY_REGISTRY_ADDRESS \
  COMPLIANCE_MODULE_ADDRESS=$COMPLIANCE_MODULE_ADDRESS \
  forge script script/DeployPropertyPipeline.s.sol --rpc-url "$RPC_URL" --broadcast)
PROPERTY_FACTORY_ADDRESS=$(echo "$OUT2" | grep "PropertyFactory:" | awk '{print $NF}')
PROPERTY_TOKEN_ADDRESS=$(echo "$OUT2" | grep "PropertyToken (imovel de exemplo):" | awk '{print $NF}')
DIVIDEND_DISTRIBUTOR_ADDRESS=$(echo "$OUT2" | grep "DividendDistributor:" | awk '{print $NF}')
echo "PropertyFactory=$PROPERTY_FACTORY_ADDRESS PropertyToken=$PROPERTY_TOKEN_ADDRESS DividendDistributor=$DIVIDEND_DISTRIBUTOR_ADDRESS"

echo "== atualizando backend/.env (PROPERTY_FACTORY_ADDRESS) =="
sed -i "s|^PROPERTY_FACTORY_ADDRESS=.*|PROPERTY_FACTORY_ADDRESS=\"$PROPERTY_FACTORY_ADDRESS\"|" "$BACKEND_ENV"

echo "== populando a tabela Property =="
cd "$BACKEND_DIR"
PROPERTY_TOKEN_ADDRESS=$PROPERTY_TOKEN_ADDRESS \
  DIVIDEND_DISTRIBUTOR_ADDRESS=$DIVIDEND_DISTRIBUTOR_ADDRESS \
  npm run seed-property

echo ""
echo "Pronto. Anvil rodando em PID $ANVIL_PID."
echo "Agora rode em terminais separados: 'npm run dev' em backend/ e em frontend/."
echo "Para depositar rendimento (painel do gestor, feature 005): POST http://localhost:3333/admin/imoveis/<id>/depositar-rendimento"
echo "  com header 'x-admin-api-key: <ADMIN_API_KEY do backend/.env>' e body {\"valor\": \"<wei>\"}."
