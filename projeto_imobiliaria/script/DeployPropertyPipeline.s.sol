// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
import {ComplianceModule} from "../src/ComplianceModule.sol";
import {PropertyToken} from "../src/PropertyToken.sol";
import {PropertyFactory} from "../src/PropertyFactory.sol";
import {DividendDistributor} from "../src/DividendDistributor.sol";
import {MockERC20} from "../test/mocks/MockERC20.sol";

/// @notice Deploy local (Anvil) da infraestrutura de imovel para exercitar o
/// backend das features 002/003 ponta a ponta: uma moeda de teste (MockERC20),
/// a PropertyFactory (feature 002-tokenizacao-imovel), um imovel de exemplo
/// ja criado via `criarImovel`, e o `DividendDistributor` desse imovel
/// (feature 003-distribuicao-rendimentos), com os papeis on-chain ja
/// concedidos (SNAPSHOT_ROLE ao distributor, DEFAULT_ADMIN_ROLE da Factory no
/// ComplianceModule).
///
/// Requer `IdentityRegistry`/`ComplianceModule` ja deployados (ver
/// `DeployIdentityKyc.s.sol`) e suas enderecos em env.
/// Uso local (Anvil): forge script script/DeployPropertyPipeline.s.sol
///   --rpc-url http://127.0.0.1:8545 --private-key <key> --broadcast
contract DeployPropertyPipeline is Script {
    function run()
        external
        returns (
            MockERC20 moeda,
            PropertyFactory factory,
            address propertyToken,
            DividendDistributor distributor
        )
    {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address complianceModuleAddress = vm.envAddress("COMPLIANCE_MODULE_ADDRESS");
        address identityRegistryAddress = vm.envAddress("IDENTITY_REGISTRY_ADDRESS");
        address deployer = vm.addr(deployerPrivateKey);

        // Parametros do imovel de exemplo - ajustaveis via env para outros cenarios de teste.
        string memory nomeImovel = vm.envOr("IMOVEL_NOME", string("Edificio Aurora"));
        uint256 valorTotal = vm.envOr("IMOVEL_VALOR_TOTAL", uint256(1_000_000 ether));
        uint256 numeroCotas = vm.envOr("IMOVEL_NUMERO_COTAS", uint256(1000));

        ComplianceModule compliance = ComplianceModule(complianceModuleAddress);
        IdentityRegistry identityRegistry = IdentityRegistry(identityRegistryAddress);

        vm.startBroadcast(deployerPrivateKey);

        moeda = new MockERC20("Real Estate Test BRL", "tBRL");

        PropertyToken implementacao = new PropertyToken();
        factory = new PropertyFactory(identityRegistry, compliance, address(moeda), deployer, address(implementacao));

        // A Factory precisa de DEFAULT_ADMIN_ROLE no ComplianceModule para
        // conceder TOKEN_ROLE a cada PropertyToken que cria.
        compliance.grantRole(compliance.DEFAULT_ADMIN_ROLE(), address(factory));

        propertyToken = factory.criarImovel(nomeImovel, valorTotal, numeroCotas);

        distributor = new DividendDistributor(PropertyToken(propertyToken));
        PropertyToken(propertyToken).grantRole(PropertyToken(propertyToken).SNAPSHOT_ROLE(), address(distributor));

        vm.stopBroadcast();

        console.log("MockERC20 (moeda de pagamento):", address(moeda));
        console.log("PropertyFactory:", address(factory));
        console.log("PropertyToken (imovel de exemplo):", propertyToken);
        console.log("DividendDistributor:", address(distributor));
    }
}
