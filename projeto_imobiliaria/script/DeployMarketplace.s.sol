// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Marketplace} from "../src/Marketplace.sol";

/// @notice Deploy local (Anvil) do `Marketplace` (feature 004-mercado-secundario),
/// compartilhado entre todos os imoveis da plataforma. Depois do deploy, o
/// proprio endereco deployado ainda precisa receber uma claim KYC_APPROVED no
/// `IdentityRegistry` para poder manter cotas em escrow (ver comentario em
/// `Marketplace.sol`) - feito por `backend/scripts/grant-marketplace-kyc.ts`.
/// Uso local (Anvil): forge script script/DeployMarketplace.s.sol
///   --rpc-url http://127.0.0.1:8545 --private-key <key> --broadcast
contract DeployMarketplace is Script {
    function run() external returns (Marketplace marketplace) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address taxaTesouraria = vm.envOr("MARKETPLACE_TAXA_TESOURARIA", vm.addr(deployerPrivateKey));
        uint256 taxaTransacaoBpsInicial = vm.envOr("MARKETPLACE_TAXA_BPS", uint256(100));

        vm.startBroadcast(deployerPrivateKey);
        marketplace = new Marketplace(taxaTesouraria, taxaTransacaoBpsInicial);
        vm.stopBroadcast();

        console.log("Marketplace:", address(marketplace));
    }
}
