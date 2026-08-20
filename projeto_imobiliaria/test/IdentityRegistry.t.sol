// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";

/// Testes de `IdentityRegistry` — feature 001-identidade-kyc.
/// Escritos a partir de `specs/features/001-identidade-kyc/spec.md`,
/// `contracts/identity-registry.md` e `test-strategy.md`.
/// TDD (specs/00-constitution.md): estes testes devem falhar (red) até
/// `src/IdentityRegistry.sol` ser implementado.
contract IdentityRegistryTest is Test {
    IdentityRegistry registry;

    address admin = makeAddr("admin");
    address issuer = makeAddr("trustedIssuer");
    address outroIssuer = makeAddr("outroTrustedIssuer");
    address investidor = makeAddr("investidor");
    address estranho = makeAddr("estranho");

    bytes32 constant KYC_TOPIC = keccak256("KYC_APPROVED");

    function setUp() public {
        vm.prank(admin);
        registry = new IdentityRegistry();

        vm.prank(admin);
        registry.adicionarTrustedIssuer(issuer);
    }

    // ---- RF-04: gestão de Trusted Issuers ----

    function test_RF04_adicionarRemoverTrustedIssuer_apenasAdmin() public {
        vm.prank(admin);
        registry.adicionarTrustedIssuer(outroIssuer);
        assertTrue(_contains(registry.trustedIssuers(), outroIssuer));

        vm.prank(admin);
        registry.removerTrustedIssuer(outroIssuer);
        assertFalse(_contains(registry.trustedIssuers(), outroIssuer));
    }

    function test_RF04_adicionarTrustedIssuer_revertSeChamadorNaoForAdmin() public {
        bytes32 role = registry.PLATFORM_ADMIN_ROLE();

        vm.prank(estranho);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, estranho, role)
        );
        registry.adicionarTrustedIssuer(outroIssuer);
    }

    function test_RF04_removerTrustedIssuer_revertSeChamadorNaoForAdmin() public {
        bytes32 role = registry.PLATFORM_ADMIN_ROLE();

        vm.prank(estranho);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, estranho, role)
        );
        registry.removerTrustedIssuer(issuer);
    }

    function test_trustedIssuers_listaIssuerAposAdicao() public view {
        assertTrue(_contains(registry.trustedIssuers(), issuer));
    }

    // ---- RF-02 / isVerified: emissão de claim ----

    function test_isVerified_falseAntesDoKYC() public view {
        assertFalse(registry.isVerified(investidor));
    }

    function test_RF02_emitirClaim_registraCorretamente() public {
        vm.expectEmit(true, true, true, false);
        emit IdentityRegistry.ClaimEmitida(investidor, KYC_TOPIC, issuer);

        vm.prank(issuer);
        registry.emitirClaim(investidor, KYC_TOPIC, "assinatura-off-chain-1");

        assertTrue(registry.temClaim(investidor, KYC_TOPIC));
    }

    function test_isVerified_trueAposKYCAprovado() public {
        vm.prank(issuer);
        registry.emitirClaim(investidor, KYC_TOPIC, "assinatura-off-chain-2");

        assertTrue(registry.isVerified(investidor));
    }

    function test_RF02_emitirClaim_revertSeIssuerNaoAutorizado() public {
        vm.prank(estranho);
        vm.expectRevert(abi.encodeWithSelector(IdentityRegistry.IssuerNaoAutorizado.selector, estranho));
        registry.emitirClaim(investidor, KYC_TOPIC, "assinatura-forjada");
    }

    function test_RF02_emitirClaim_revertSeAssinaturaReutilizada() public {
        vm.prank(issuer);
        registry.emitirClaim(investidor, KYC_TOPIC, "assinatura-unica");

        vm.prank(issuer);
        vm.expectRevert(
            abi.encodeWithSelector(IdentityRegistry.AssinaturaJaUtilizada.selector, keccak256("assinatura-unica"))
        );
        registry.emitirClaim(estranho, KYC_TOPIC, "assinatura-unica");
    }

    /// Nenhum endereço aleatório que não seja Trusted Issuer autorizado consegue emitir
    /// claim — protege a invariante de `identity-registry.md`.
    function testFuzz_emitirClaim_comEnderecosAleatorios(address chamador, address carteira) public {
        vm.assume(chamador != issuer);
        vm.assume(chamador != address(0));

        vm.prank(chamador);
        vm.expectRevert(abi.encodeWithSelector(IdentityRegistry.IssuerNaoAutorizado.selector, chamador));
        registry.emitirClaim(carteira, KYC_TOPIC, "assinatura-fuzz");

        assertFalse(registry.isVerified(carteira));
    }

    // ---- RF-05: revogação de claim ----

    function test_RF05_revogarClaim_bloqueiaFuturasTransferencias() public {
        vm.prank(issuer);
        registry.emitirClaim(investidor, KYC_TOPIC, "assinatura-revogavel");
        assertTrue(registry.isVerified(investidor));

        vm.expectEmit(true, true, false, true);
        emit IdentityRegistry.ClaimRevogada(investidor, KYC_TOPIC, issuer);

        vm.prank(issuer);
        registry.revogarClaim(investidor, KYC_TOPIC);

        assertFalse(registry.isVerified(investidor));
        assertFalse(registry.temClaim(investidor, KYC_TOPIC));
    }

    function test_revogarClaim_permiteAdminRevogarClaimDeQualquerIssuer() public {
        vm.prank(issuer);
        registry.emitirClaim(investidor, KYC_TOPIC, "assinatura-admin-revoga");

        vm.prank(admin);
        registry.revogarClaim(investidor, KYC_TOPIC);

        assertFalse(registry.isVerified(investidor));
    }

    function test_revogarClaim_revertSeChamadorNaoForIssuerNemAdmin() public {
        vm.prank(issuer);
        registry.emitirClaim(investidor, KYC_TOPIC, "assinatura-protegida");

        vm.prank(estranho);
        vm.expectRevert(
            abi.encodeWithSelector(IdentityRegistry.RevogacaoNaoAutorizada.selector, estranho, investidor, KYC_TOPIC)
        );
        registry.revogarClaim(investidor, KYC_TOPIC);
    }

    // ---- Cenário "Remoção de Trusted Issuer" (spec.md) ----

    function test_removerTrustedIssuer_naoInvalidaClaimsJaEmitidas() public {
        vm.prank(issuer);
        registry.emitirClaim(investidor, KYC_TOPIC, "assinatura-antes-da-remocao");
        assertTrue(registry.isVerified(investidor));

        vm.prank(admin);
        registry.removerTrustedIssuer(issuer);

        // Claim já emitida permanece válida — não retroage (identity-registry.md, Invariantes).
        assertTrue(registry.isVerified(investidor));
    }

    function test_removerTrustedIssuer_impedeNovasClaimsDoIssuerRemovido() public {
        vm.prank(admin);
        registry.removerTrustedIssuer(issuer);

        vm.prank(issuer);
        vm.expectRevert(abi.encodeWithSelector(IdentityRegistry.IssuerNaoAutorizado.selector, issuer));
        registry.emitirClaim(investidor, KYC_TOPIC, "assinatura-pos-remocao");
    }

    function _contains(address[] memory lista, address alvo) internal pure returns (bool) {
        for (uint256 i = 0; i < lista.length; i++) {
            if (lista[i] == alvo) return true;
        }
        return false;
    }
}
