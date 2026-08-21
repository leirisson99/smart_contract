// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
import {ComplianceModule} from "../src/ComplianceModule.sol";
import {PropertyToken} from "../src/PropertyToken.sol";
import {DividendDistributor} from "../src/DividendDistributor.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

/// Testes de `DividendDistributor` — feature 003-distribuicao-rendimentos.
/// Escritos a partir de `spec.md` e `contracts/dividend-distributor.md`.
/// TDD (specs/00-constitution.md): devem falhar (red) até
/// `src/DividendDistributor.sol` ser implementado.
///
/// Não é deployado via Factory/clone (ADR-0005 não exige isso para esta
/// feature, e a frequência de deploy é baixa — um por imóvel). Como passo de
/// deploy, precisa de SNAPSHOT_ROLE no PropertyToken do imóvel.
contract DividendDistributorTest is Test {
    IdentityRegistry identityRegistry;
    ComplianceModule compliance;
    MockERC20 moeda;
    PropertyToken token;
    DividendDistributor distributor;

    address admin = makeAddr("admin");
    address issuer = makeAddr("trustedIssuer");
    address tesouraria = makeAddr("tesouraria");
    address gestor = makeAddr("gestor");
    address investidorA = makeAddr("investidorA");
    address investidorB = makeAddr("investidorB");
    address estranho = makeAddr("estranho");

    bytes32 constant KYC_TOPIC = keccak256("KYC_APPROVED");

    uint256 constant TOTAL_COTAS = 1_000;
    uint256 constant PRECO_POR_COTA = 10_000e18;

    function setUp() public {
        vm.startPrank(admin);
        identityRegistry = new IdentityRegistry();
        identityRegistry.adicionarTrustedIssuer(issuer);
        compliance = new ComplianceModule(identityRegistry);
        moeda = new MockERC20("Stablecoin Mock", "mBRZ");

        PropertyToken implementacao = new PropertyToken();
        token = PropertyToken(Clones.clone(address(implementacao)));
        compliance.grantRole(compliance.TOKEN_ROLE(), address(token));
        token.inicializar(
            "Edificio Teste",
            TOTAL_COTAS,
            PRECO_POR_COTA,
            address(compliance),
            address(identityRegistry),
            address(moeda),
            tesouraria,
            admin
        );

        distributor = new DividendDistributor(token);
        token.grantRole(token.SNAPSHOT_ROLE(), address(distributor));
        distributor.grantRole(distributor.GESTOR_ROLE(), gestor);
        vm.stopPrank();

        vm.startPrank(issuer);
        identityRegistry.emitirClaim(investidorA, KYC_TOPIC, "assinatura-A");
        identityRegistry.emitirClaim(investidorB, KYC_TOPIC, "assinatura-B");
        vm.stopPrank();

        moeda.mint(investidorA, 10_000_000e18);
        vm.prank(investidorA);
        moeda.approve(address(token), type(uint256).max);
        vm.prank(investidorA);
        token.comprarCotas(50); // 5% das cotas

        moeda.mint(investidorB, 10_000_000e18);
        vm.prank(investidorB);
        moeda.approve(address(token), type(uint256).max);
        vm.prank(investidorB);
        token.comprarCotas(950); // 95% das cotas
    }

    function _financiarGestor(uint256 valor) private {
        moeda.mint(gestor, valor);
        vm.prank(gestor);
        moeda.approve(address(distributor), valor);
    }

    // ---- RF-11 / RF-12: depósito e snapshot ----

    function test_RF11_depositarRendimento_criaNovoCiclo() public {
        _financiarGestor(50_000e18);

        vm.expectEmit(true, false, false, true);
        emit DividendDistributor.RendimentoDepositado(1, 50_000e18, 1_000);

        vm.prank(gestor);
        uint256 idCiclo = distributor.depositarRendimento(50_000e18);

        assertEq(idCiclo, 1);
        assertEq(distributor.cicloAtual(), 1);
        assertEq(moeda.balanceOf(address(distributor)), 50_000e18);
    }

    function test_RF11_depositarRendimento_revertSeNaoForGestor() public {
        bytes32 role = distributor.GESTOR_ROLE();

        vm.prank(estranho);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, estranho, role)
        );
        distributor.depositarRendimento(50_000e18);
    }

    function test_depositarRendimento_revertSeValorZero() public {
        vm.prank(gestor);
        vm.expectRevert(DividendDistributor.ValorInvalido.selector);
        distributor.depositarRendimento(0);
    }

    function test_depositarRendimento_revertSeSemHoldersParaDistribuir() public {
        // token novo, sem nenhuma cota vendida ainda
        vm.startPrank(admin);
        PropertyToken implementacao = new PropertyToken();
        PropertyToken tokenVazio = PropertyToken(Clones.clone(address(implementacao)));
        compliance.grantRole(compliance.TOKEN_ROLE(), address(tokenVazio));
        tokenVazio.inicializar(
            "Edificio Vazio",
            TOTAL_COTAS,
            PRECO_POR_COTA,
            address(compliance),
            address(identityRegistry),
            address(moeda),
            tesouraria,
            admin
        );

        DividendDistributor distributorVazio = new DividendDistributor(tokenVazio);
        tokenVazio.grantRole(tokenVazio.SNAPSHOT_ROLE(), address(distributorVazio));
        distributorVazio.grantRole(distributorVazio.GESTOR_ROLE(), gestor);
        vm.stopPrank();

        moeda.mint(gestor, 1_000e18);
        vm.prank(gestor);
        moeda.approve(address(distributorVazio), 1_000e18);

        vm.prank(gestor);
        vm.expectRevert(DividendDistributor.SemHoldersParaDistribuir.selector);
        distributorVazio.depositarRendimento(1_000e18);
    }

    function test_RF12_snapshotRefleteSaldoNoDeposito() public {
        _financiarGestor(50_000e18);
        vm.prank(gestor);
        distributor.depositarRendimento(50_000e18);

        // investidorA vende toda sua posição depois do depósito
        vm.prank(investidorA);
        token.transfer(investidorB, 50);

        // valorReivindicavel do ciclo 1 continua baseado no snapshot (5%), não no saldo atual (0%)
        assertEq(distributor.valorReivindicavel(investidorA, 1), 2_500e18);
    }

    // ---- RF-13: claim proporcional ----

    function test_RF13_claim_transfereValorProporcional() public {
        _financiarGestor(50_000e18);
        vm.prank(gestor);
        distributor.depositarRendimento(50_000e18);

        assertEq(distributor.valorReivindicavel(investidorA, 1), 2_500e18); // 5% de 50_000
        assertEq(distributor.valorReivindicavel(investidorB, 1), 47_500e18); // 95% de 50_000

        vm.expectEmit(true, true, false, true);
        emit DividendDistributor.RendimentoReivindicado(investidorA, 1, 2_500e18);

        uint256 saldoAntes = moeda.balanceOf(investidorA);
        vm.prank(investidorA);
        distributor.claim(1);

        assertEq(moeda.balanceOf(investidorA) - saldoAntes, 2_500e18);
        assertEq(distributor.valorReivindicavel(investidorA, 1), 0);
    }

    // ---- RF-14: claim duplicado bloqueado ----

    function test_RF14_claim_revertSeJaReivindicado() public {
        _financiarGestor(50_000e18);
        vm.prank(gestor);
        distributor.depositarRendimento(50_000e18);

        vm.prank(investidorA);
        distributor.claim(1);

        vm.prank(investidorA);
        vm.expectRevert(abi.encodeWithSelector(DividendDistributor.NadaAReivindicar.selector, investidorA, 1));
        distributor.claim(1);
    }

    function test_claim_revertSeNadaAReivindicar_semSaldoNoSnapshot() public {
        _financiarGestor(50_000e18);
        vm.prank(gestor);
        distributor.depositarRendimento(50_000e18);

        vm.prank(estranho);
        vm.expectRevert(abi.encodeWithSelector(DividendDistributor.NadaAReivindicar.selector, estranho, 1));
        distributor.claim(1);
    }

    function test_claim_revertSeCicloInvalido() public {
        vm.prank(investidorA);
        vm.expectRevert(abi.encodeWithSelector(DividendDistributor.NadaAReivindicar.selector, investidorA, 1));
        distributor.claim(1);
    }

    // ---- RF-15: múltiplos ciclos ----

    function test_RF15_multiplosCiclos_claimIndependente() public {
        uint256 saldoInicial = moeda.balanceOf(investidorA);

        _financiarGestor(50_000e18);
        vm.prank(gestor);
        distributor.depositarRendimento(50_000e18);

        vm.prank(investidorA);
        distributor.claim(1);

        _financiarGestor(60_000e18);
        vm.prank(gestor);
        distributor.depositarRendimento(60_000e18);

        assertEq(distributor.cicloAtual(), 2);
        assertEq(distributor.valorReivindicavel(investidorA, 2), 3_000e18); // 5% de 60_000

        vm.prank(investidorA);
        distributor.claim(2);

        assertEq(moeda.balanceOf(investidorA) - saldoInicial, 2_500e18 + 3_000e18);
        assertTrue(distributor.jaReivindicou(investidorA, 1));
        assertTrue(distributor.jaReivindicou(investidorA, 2));
    }

    function test_claimTodos_reivindicaTodosOsCiclosPendentes() public {
        uint256 saldoInicial = moeda.balanceOf(investidorA);

        _financiarGestor(50_000e18);
        vm.prank(gestor);
        distributor.depositarRendimento(50_000e18);

        _financiarGestor(60_000e18);
        vm.prank(gestor);
        distributor.depositarRendimento(60_000e18);

        vm.prank(investidorA);
        distributor.claimTodos();

        assertEq(moeda.balanceOf(investidorA) - saldoInicial, 2_500e18 + 3_000e18);
        assertTrue(distributor.jaReivindicou(investidorA, 1));
        assertTrue(distributor.jaReivindicou(investidorA, 2));
    }

    /// Cenário "Transferência de cota entre ciclos" (spec.md): vender a cota
    /// após o snapshot do ciclo N não afeta o claim do ciclo N.
    function test_Integracao_transferenciaEntreCiclosNaoAfetaClaimAnterior() public {
        uint256 saldoInicial = moeda.balanceOf(investidorA);

        _financiarGestor(50_000e18);
        vm.prank(gestor);
        distributor.depositarRendimento(50_000e18);

        vm.prank(investidorA);
        token.transfer(investidorB, 50);
        assertEq(token.balanceOf(investidorA), 0);

        vm.prank(investidorA);
        distributor.claim(1);

        assertEq(moeda.balanceOf(investidorA) - saldoInicial, 2_500e18);
    }

    // ---- Dust / arredondamento ----

    function test_dust_naoSePerdeEAcumulaNoContrato() public {
        uint256 saldoInicialA = moeda.balanceOf(investidorA);
        uint256 saldoInicialB = moeda.balanceOf(investidorB);

        // 1000 cotas, valor não divisível de forma exata por 1000
        _financiarGestor(1_000e18 + 1); // gera resíduo de 1 wei por cota
        vm.prank(gestor);
        distributor.depositarRendimento(1_000e18 + 1);

        vm.prank(investidorA);
        distributor.claim(1); // 50 cotas de 1000 -> (1_000e18+1)*50/1000, com resto descartado
        vm.prank(investidorB);
        distributor.claim(1); // 950 cotas de 1000

        uint256 totalReivindicado =
            (moeda.balanceOf(investidorA) - saldoInicialA) + (moeda.balanceOf(investidorB) - saldoInicialB);
        assertLe(totalReivindicado, 1_000e18 + 1);

        uint256 saldoRestanteNoContrato = moeda.balanceOf(address(distributor));
        assertEq(totalReivindicado + saldoRestanteNoContrato, 1_000e18 + 1);
    }

    // ---- Fuzz ----

    function testFuzz_depositarRendimento_valoresAleatorios(uint256 valor) public {
        valor = bound(valor, 1, 1_000_000_000e18);
        _financiarGestor(valor);

        vm.prank(gestor);
        uint256 idCiclo = distributor.depositarRendimento(valor);

        assertEq(
            distributor.valorReivindicavel(investidorA, idCiclo) + distributor.valorReivindicavel(investidorB, idCiclo)
                <= valor,
            true
        );
    }

    function testFuzz_claim_comDistribuicoesDeSaldoAleatorias(uint256 quantidadeExtraA, uint256 valor) public {
        // investidorA compra mais cotas antes do depósito, alterando a proporção
        quantidadeExtraA = bound(quantidadeExtraA, 0, 950);
        valor = bound(valor, 1, 1_000_000e18);

        if (quantidadeExtraA > 0) {
            vm.prank(investidorB);
            token.transfer(investidorA, quantidadeExtraA);
        }

        _financiarGestor(valor);
        vm.prank(gestor);
        uint256 idCiclo = distributor.depositarRendimento(valor);

        uint256 totalReivindicavel =
            distributor.valorReivindicavel(investidorA, idCiclo) + distributor.valorReivindicavel(investidorB, idCiclo);
        assertLe(totalReivindicavel, valor);
    }
}
