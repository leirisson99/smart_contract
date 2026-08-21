// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
import {ComplianceModule} from "../src/ComplianceModule.sol";
import {PropertyToken} from "../src/PropertyToken.sol";
import {PropertyFactory} from "../src/PropertyFactory.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

/// Testes de integração `PropertyFactory` + `PropertyToken` + `IdentityRegistry`/
/// `ComplianceModule` (feature 001) — tasks.md item 6 da feature
/// 002-tokenizacao-imovel. Exercita o fluxo ponta a ponta descrito em
/// `spec.md`: criação de imóvel, compra por investidor verificado, bloqueio
/// por falta de KYC e por overselling.
contract IntegrationPropertyFactoryTest is Test {
    IdentityRegistry identityRegistry;
    ComplianceModule compliance;
    MockERC20 moeda;
    PropertyFactory factory;

    address admin = makeAddr("admin");
    address issuer = makeAddr("trustedIssuer");
    address tesouraria = makeAddr("tesouraria");
    address investidorA = makeAddr("investidorA");
    address investidorB = makeAddr("investidorB");
    address naoVerificado = makeAddr("naoVerificado");

    bytes32 constant KYC_TOPIC = keccak256("KYC_APPROVED");

    function setUp() public {
        vm.startPrank(admin);
        identityRegistry = new IdentityRegistry();
        identityRegistry.adicionarTrustedIssuer(issuer);
        compliance = new ComplianceModule(identityRegistry);
        moeda = new MockERC20("Stablecoin Mock", "mBRZ");

        PropertyToken implementacao = new PropertyToken();
        factory = new PropertyFactory(identityRegistry, compliance, address(moeda), tesouraria, address(implementacao));
        compliance.grantRole(compliance.DEFAULT_ADMIN_ROLE(), address(factory));
        vm.stopPrank();

        vm.startPrank(issuer);
        identityRegistry.emitirClaim(investidorA, KYC_TOPIC, "assinatura-A");
        identityRegistry.emitirClaim(investidorB, KYC_TOPIC, "assinatura-B");
        vm.stopPrank();
    }

    function test_Integracao_criacaoDeImovelECompraPorInvestidorVerificado() public {
        vm.prank(admin);
        address propertyTokenAddr = factory.criarImovel("Edificio X", 10_000_000e18, 1_000);
        PropertyToken token = PropertyToken(propertyTokenAddr);

        moeda.mint(investidorA, 100_000e18);
        vm.prank(investidorA);
        moeda.approve(address(token), type(uint256).max);

        vm.prank(investidorA);
        token.comprarCotas(5);

        assertEq(token.balanceOf(investidorA), 5);
        assertEq(token.cotasDisponiveis(), 995);
        assertEq(moeda.balanceOf(tesouraria), 5 * token.precoPorCota());
    }

    function test_Integracao_compraBloqueadaSemKYC() public {
        vm.prank(admin);
        address propertyTokenAddr = factory.criarImovel("Edificio X", 10_000_000e18, 1_000);
        PropertyToken token = PropertyToken(propertyTokenAddr);

        moeda.mint(naoVerificado, 100_000e18);
        vm.prank(naoVerificado);
        moeda.approve(address(token), type(uint256).max);

        vm.prank(naoVerificado);
        vm.expectRevert(
            abi.encodeWithSelector(PropertyToken.ComplianceNaoVerificado.selector, "destino sem KYC verificado")
        );
        token.comprarCotas(1);
    }

    function test_Integracao_overSellingBloqueadoTudoOuNada() public {
        vm.prank(admin);
        address propertyTokenAddr = factory.criarImovel("Edificio X", 20_000e18, 2);
        PropertyToken token = PropertyToken(propertyTokenAddr);

        moeda.mint(investidorA, 100_000e18);
        vm.prank(investidorA);
        moeda.approve(address(token), type(uint256).max);

        vm.prank(investidorA);
        vm.expectRevert(abi.encodeWithSelector(PropertyToken.CotasIndisponiveis.selector, 5, 2));
        token.comprarCotas(5);

        assertEq(token.balanceOf(investidorA), 0);
    }

    function test_Integracao_transferenciaSecundariaEntreVerificadosRespeitaCompliance() public {
        vm.prank(admin);
        address propertyTokenAddr = factory.criarImovel("Edificio X", 10_000_000e18, 1_000);
        PropertyToken token = PropertyToken(propertyTokenAddr);

        moeda.mint(investidorA, 100_000e18);
        vm.prank(investidorA);
        moeda.approve(address(token), type(uint256).max);
        vm.prank(investidorA);
        token.comprarCotas(10);

        vm.prank(investidorA);
        token.transfer(investidorB, 3);

        assertEq(token.balanceOf(investidorA), 7);
        assertEq(token.balanceOf(investidorB), 3);
    }

    function test_Integracao_doisImoveisIsoladosMasComplianceCompartilhado() public {
        vm.startPrank(admin);
        address imovel1Addr = factory.criarImovel("Edificio 1", 10_000_000e18, 1_000);
        address imovel2Addr = factory.criarImovel("Edificio 2", 5_000_000e18, 500);
        vm.stopPrank();

        PropertyToken imovel1 = PropertyToken(imovel1Addr);
        PropertyToken imovel2 = PropertyToken(imovel2Addr);

        moeda.mint(investidorA, 1_000_000e18);
        vm.startPrank(investidorA);
        moeda.approve(imovel1Addr, type(uint256).max);
        moeda.approve(imovel2Addr, type(uint256).max);
        imovel1.comprarCotas(2);
        imovel2.comprarCotas(3);
        vm.stopPrank();

        assertEq(imovel1.balanceOf(investidorA), 2);
        assertEq(imovel2.balanceOf(investidorA), 3);

        // revogar o KYC de investidorA bloqueia compras em QUALQUER imóvel,
        // pois o ComplianceModule/IdentityRegistry são compartilhados.
        vm.prank(issuer);
        identityRegistry.revogarClaim(investidorA, KYC_TOPIC);

        vm.prank(investidorA);
        vm.expectRevert(
            abi.encodeWithSelector(PropertyToken.ComplianceNaoVerificado.selector, "destino sem KYC verificado")
        );
        imovel1.comprarCotas(1);

        vm.prank(investidorA);
        vm.expectRevert(
            abi.encodeWithSelector(PropertyToken.ComplianceNaoVerificado.selector, "destino sem KYC verificado")
        );
        imovel2.comprarCotas(1);
    }
}
