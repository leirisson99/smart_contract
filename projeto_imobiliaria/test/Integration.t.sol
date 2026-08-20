// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
import {ComplianceModule} from "../src/ComplianceModule.sol";
import {MockPropertyToken} from "./mocks/MockPropertyToken.sol";

/// Testes de integração `IdentityRegistry` + `ComplianceModule` + mock de token
/// (tasks.md item 6 da feature 001-identidade-kyc). Exercita o fluxo ponta a
/// ponta descrito em `spec.md`: mint/transfer só avançam quando `canTransfer`
/// permite, e a revogação de claim bloqueia futuras transferências sem
/// confiscar saldo já existente.
contract IntegrationTest is Test {
    IdentityRegistry identityRegistry;
    ComplianceModule compliance;
    MockPropertyToken token;

    address admin = makeAddr("admin");
    address issuer = makeAddr("trustedIssuer");
    address investidorA = makeAddr("investidorA");
    address investidorB = makeAddr("investidorB");
    address naoVerificado = makeAddr("naoVerificado");

    bytes32 constant KYC_TOPIC = keccak256("KYC_APPROVED");

    function setUp() public {
        vm.startPrank(admin);
        identityRegistry = new IdentityRegistry();
        identityRegistry.adicionarTrustedIssuer(issuer);

        compliance = new ComplianceModule(identityRegistry);
        token = new MockPropertyToken(compliance);
        compliance.grantRole(compliance.TOKEN_ROLE(), address(token));
        vm.stopPrank();

        vm.startPrank(issuer);
        identityRegistry.emitirClaim(investidorA, KYC_TOPIC, "assinatura-A");
        identityRegistry.emitirClaim(investidorB, KYC_TOPIC, "assinatura-B");
        vm.stopPrank();
    }

    function test_Integracao_mintBloqueadoParaCarteiraSemKYC() public {
        vm.expectRevert(
            abi.encodeWithSelector(MockPropertyToken.ComplianceNaoVerificado.selector, "destino sem KYC verificado")
        );
        token.mint(naoVerificado, 100);

        assertEq(token.balanceOf(naoVerificado), 0);
    }

    function test_Integracao_mintETransferenciaFluemComKYCAprovado() public {
        token.mint(investidorA, 1_000);
        assertEq(token.balanceOf(investidorA), 1_000);
        assertTrue(compliance.isHolder(investidorA));

        vm.prank(investidorA);
        token.transfer(investidorB, 300);

        assertEq(token.balanceOf(investidorA), 700);
        assertEq(token.balanceOf(investidorB), 300);
        assertTrue(compliance.isHolder(investidorB));
        assertEq(compliance.holderCount(), 2);
    }

    /// Cenário "Revogação de claim" (spec.md): revogar a claim de um investidor
    /// bloqueia futuras transferências PARA ele, mas não confisca o saldo que
    /// ele já possui.
    function test_Integracao_revogacaoClaimBloqueiaEntradaMasNaoConfiscaSaldo() public {
        token.mint(investidorA, 1_000);
        assertEq(token.balanceOf(investidorA), 1_000);

        vm.prank(issuer);
        identityRegistry.revogarClaim(investidorA, KYC_TOPIC);

        // saldo existente permanece intacto — não há confisco automático
        assertEq(token.balanceOf(investidorA), 1_000);

        // mas novas transferências para essa carteira revertem
        token.mint(investidorB, 1); // dá saldo a B para tentar transferir
        vm.prank(investidorB);
        vm.expectRevert(
            abi.encodeWithSelector(MockPropertyToken.ComplianceNaoVerificado.selector, "destino sem KYC verificado")
        );
        token.transfer(investidorA, 1);
    }

    function test_Integracao_limiteHoldersImpedeNovoHolderViaToken() public {
        vm.prank(admin);
        compliance.definirLimiteHolders(1);

        token.mint(investidorA, 100);
        assertEq(compliance.holderCount(), 1);

        vm.expectRevert(
            abi.encodeWithSelector(MockPropertyToken.ComplianceNaoVerificado.selector, "limite de holders atingido")
        );
        token.mint(investidorB, 100);

        assertEq(token.balanceOf(investidorB), 0);
    }

    function test_Integracao_transferenciaEntreHoldersExistentesFuncionaNoLimite() public {
        vm.prank(admin);
        compliance.definirLimiteHolders(2);

        token.mint(investidorA, 100);
        token.mint(investidorB, 100);
        assertEq(compliance.holderCount(), 2);

        // limite já atingido, mas transferir entre holders já existentes não cria holder novo
        vm.prank(investidorA);
        token.transfer(investidorB, 50);

        assertEq(token.balanceOf(investidorA), 50);
        assertEq(token.balanceOf(investidorB), 150);
        assertEq(compliance.holderCount(), 2);
    }
}
