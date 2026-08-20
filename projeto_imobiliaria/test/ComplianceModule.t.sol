// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
import {ComplianceModule} from "../src/ComplianceModule.sol";

/// Testes de `ComplianceModule` — feature 001-identidade-kyc.
/// Escritos a partir de `contracts/compliance-module.md` e `test-strategy.md`.
/// TDD (specs/00-constitution.md): estes testes devem falhar (red) até
/// `src/ComplianceModule.sol` ser implementado.
///
/// A spec não define como o contador de holders chega ao módulo (o
/// `PropertyToken` só existe na Sprint 2). Aqui assumimos um hook
/// `registrarTransferencia`, restrito a `TOKEN_ROLE`, chamado pelo token
/// (ou por um mock, como aqui) após cada transferência bem-sucedida —
/// mantém `canTransfer` como `view` pura, conforme invariante da spec.
contract ComplianceModuleTest is Test {
    IdentityRegistry identityRegistry;
    ComplianceModule compliance;

    address admin = makeAddr("admin");
    address issuer = makeAddr("trustedIssuer");
    address tokenMock = makeAddr("tokenMock");
    address estranho = makeAddr("estranho");
    address remetente = makeAddr("remetente");
    address investidorVerificado = makeAddr("investidorVerificado");
    address investidorNaoVerificado = makeAddr("investidorNaoVerificado");

    bytes32 constant KYC_TOPIC = keccak256("KYC_APPROVED");

    function setUp() public {
        vm.startPrank(admin);
        identityRegistry = new IdentityRegistry();
        identityRegistry.adicionarTrustedIssuer(issuer);
        compliance = new ComplianceModule(identityRegistry);
        compliance.grantRole(compliance.TOKEN_ROLE(), tokenMock);
        vm.stopPrank();

        vm.prank(issuer);
        identityRegistry.emitirClaim(investidorVerificado, KYC_TOPIC, "assinatura-1");
    }

    // ---- canTransfer / KYC ----

    function test_ComplianceModule_canTransfer_bloqueiaSemKYC() public view {
        assertFalse(compliance.canTransfer(remetente, investidorNaoVerificado, 1));
    }

    function test_ComplianceModule_canTransfer_permiteComKYC() public view {
        assertTrue(compliance.canTransfer(remetente, investidorVerificado, 1));
    }

    function test_motivoBloqueio_indicaFaltaDeKYC() public view {
        assertEq(compliance.motivoBloqueio(remetente, investidorNaoVerificado), "destino sem KYC verificado");
    }

    function test_motivoBloqueio_vazioQuandoPermitido() public view {
        assertEq(compliance.motivoBloqueio(remetente, investidorVerificado), "");
    }

    /// Invariante de `compliance-module.md`: `canTransfer` nunca retorna `true`
    /// quando `isVerified(para) == false`, para nenhuma combinação de parâmetros.
    function testFuzz_canTransfer_nuncaPermiteSemKYC(address para, uint256 quantidade) public view {
        vm.assume(!identityRegistry.isVerified(para));
        assertFalse(compliance.canTransfer(remetente, para, quantidade));
    }

    // ---- Configuração restrita ----

    function test_definirLimiteHolders_revertSeChamadorNaoForComplianceAdmin() public {
        bytes32 role = compliance.COMPLIANCE_ADMIN_ROLE();

        vm.prank(estranho);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, estranho, role)
        );
        compliance.definirLimiteHolders(1);
    }

    function test_registrarTransferencia_revertSeChamadorNaoForToken() public {
        bytes32 role = compliance.TOKEN_ROLE();

        vm.prank(estranho);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, estranho, role)
        );
        compliance.registrarTransferencia(remetente, investidorVerificado, 0, 1);
    }

    function test_definirLimiteHolders_zeroSignificaSemLimite() public {
        vm.prank(admin);
        compliance.definirLimiteHolders(0);

        assertTrue(compliance.canTransfer(remetente, investidorVerificado, 1));
    }

    // ---- Limite de holders ----

    function test_canTransfer_bloqueiaQuandoLimiteHoldersAtingido() public {
        address holder1 = makeAddr("holder1");
        vm.prank(issuer);
        identityRegistry.emitirClaim(holder1, KYC_TOPIC, "assinatura-holder1");

        vm.prank(admin);
        compliance.definirLimiteHolders(1);

        vm.prank(tokenMock);
        compliance.registrarTransferencia(address(0), holder1, 0, 100);

        // limite já atingido por holder1 — um novo holder não pode entrar
        assertFalse(compliance.canTransfer(remetente, investidorVerificado, 1));
        assertEq(compliance.motivoBloqueio(remetente, investidorVerificado), "limite de holders atingido");

        // mas holder1, que já é holder, pode continuar recebendo mais cotas
        assertTrue(compliance.canTransfer(remetente, holder1, 1));
    }

    function test_registrarTransferencia_removeHolderQuandoSaldoZera() public {
        address holder1 = makeAddr("holder1");
        vm.prank(issuer);
        identityRegistry.emitirClaim(holder1, KYC_TOPIC, "assinatura-holder1");

        vm.prank(admin);
        compliance.definirLimiteHolders(1);

        vm.startPrank(tokenMock);
        compliance.registrarTransferencia(address(0), holder1, 0, 100);
        assertEq(compliance.holderCount(), 1);

        // holder1 transfere todo o saldo para investidorVerificado e deixa de ser holder
        compliance.registrarTransferencia(holder1, investidorVerificado, 0, 100);
        vm.stopPrank();

        assertEq(compliance.holderCount(), 1);
        assertFalse(compliance.isHolder(holder1));
        assertTrue(compliance.isHolder(investidorVerificado));

        // slot vago — outro investidor verificado pode agora se tornar holder
        address holder2 = makeAddr("holder2");
        vm.prank(issuer);
        identityRegistry.emitirClaim(holder2, KYC_TOPIC, "assinatura-holder2");
        assertFalse(compliance.canTransfer(remetente, holder2, 1));
    }

    /// testFuzz_limiteHolders_comQuantidadesAleatorias (test-strategy.md): para um
    /// limite e uma sequência de novos holders candidatos, apenas os primeiros
    /// `limite` conseguem entrar; os demais são bloqueados.
    function testFuzz_limiteHolders_comQuantidadesAleatorias(uint8 limite, uint8 numCandidatos) public {
        limite = uint8(bound(limite, 1, 20));
        numCandidatos = uint8(bound(numCandidatos, 0, 30));

        vm.prank(admin);
        compliance.definirLimiteHolders(limite);

        uint256 holdersAdmitidos;
        for (uint256 i = 0; i < numCandidatos; i++) {
            address candidato = address(uint160(uint256(keccak256(abi.encode("candidato", i)))));

            vm.prank(issuer);
            identityRegistry.emitirClaim(candidato, KYC_TOPIC, abi.encode("assinatura", i));

            bool podeReceber = compliance.canTransfer(remetente, candidato, 1);
            assertEq(podeReceber, holdersAdmitidos < limite);

            if (podeReceber) {
                vm.prank(tokenMock);
                compliance.registrarTransferencia(address(0), candidato, 0, 1);
                holdersAdmitidos++;
            }
        }

        assertLe(compliance.holderCount(), limite);
    }
}
