// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
import {ComplianceModule} from "../src/ComplianceModule.sol";
import {PropertyToken} from "../src/PropertyToken.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {MaliciousReentrantToken} from "./mocks/MaliciousReentrantToken.sol";

/// Testes de `PropertyToken` — feature 002-tokenizacao-imovel.
/// Escritos a partir de `spec.md`, `contracts/property-token.md` e
/// `test-strategy.md`. TDD (specs/00-constitution.md): devem falhar (red) até
/// `src/PropertyToken.sol` ser implementado.
///
/// `PropertyToken` é deployado como minimal proxy (EIP-1167) pela
/// `PropertyFactory` (RNF-05), por isso o setUp aqui clona a implementação e
/// chama `inicializar` no clone — exatamente como a Factory faz — em vez de
/// usar `new PropertyToken()` diretamente.
///
/// A moeda de liquidação (RISK-08, ainda em aberto) é desacoplada via um
/// endereço ERC-20 configurável (`MockERC20` aqui), conforme workaround
/// previsto em sprints/sprint-02-tokenizacao-imovel.md.
contract PropertyTokenTest is Test {
    IdentityRegistry identityRegistry;
    ComplianceModule compliance;
    MockERC20 moeda;
    PropertyToken implementacao;
    PropertyToken token;

    address admin = makeAddr("admin");
    address issuer = makeAddr("trustedIssuer");
    address tesouraria = makeAddr("tesouraria");
    address investidorVerificado = makeAddr("investidorVerificado");
    address investidorNaoVerificado = makeAddr("investidorNaoVerificado");
    address estranho = makeAddr("estranho");
    address distribuidor = makeAddr("distribuidor");

    bytes32 constant KYC_TOPIC = keccak256("KYC_APPROVED");

    uint256 constant TOTAL_COTAS = 1_000;
    uint256 constant PRECO_POR_COTA = 10_000e18;

    function setUp() public {
        vm.startPrank(admin);
        identityRegistry = new IdentityRegistry();
        identityRegistry.adicionarTrustedIssuer(issuer);
        compliance = new ComplianceModule(identityRegistry);
        moeda = new MockERC20("Stablecoin Mock", "mBRZ");

        implementacao = new PropertyToken();
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
        token.grantRole(token.SNAPSHOT_ROLE(), distribuidor);
        vm.stopPrank();

        vm.prank(issuer);
        identityRegistry.emitirClaim(investidorVerificado, KYC_TOPIC, "assinatura-1");

        moeda.mint(investidorVerificado, 10_000_000e18);
        vm.prank(investidorVerificado);
        moeda.approve(address(token), type(uint256).max);
    }

    // ---- inicializar / clone hardening ----

    function test_inicializar_revertSeChamadoDeNovo() public {
        vm.expectRevert(PropertyToken.JaInicializado.selector);
        token.inicializar(
            "Outro",
            TOTAL_COTAS,
            PRECO_POR_COTA,
            address(compliance),
            address(identityRegistry),
            address(moeda),
            tesouraria,
            admin
        );
    }

    function test_inicializar_revertNaImplementacaoDireta() public {
        vm.expectRevert(PropertyToken.JaInicializado.selector);
        implementacao.inicializar(
            "Outro",
            TOTAL_COTAS,
            PRECO_POR_COTA,
            address(compliance),
            address(identityRegistry),
            address(moeda),
            tesouraria,
            admin
        );
    }

    // ---- RF-07 / RF-08: compra primária ----

    function test_RF07_comprarCotas_creditaSaldoComKYC() public {
        vm.expectEmit(true, false, false, true, address(token));
        emit PropertyToken.CotasCompradas(investidorVerificado, 5, 5 * PRECO_POR_COTA);

        vm.prank(investidorVerificado);
        token.comprarCotas(5);

        assertEq(token.balanceOf(investidorVerificado), 5);
        assertEq(token.totalSupply(), 5);
        assertEq(token.cotasDisponiveis(), TOTAL_COTAS - 5);
        assertEq(moeda.balanceOf(tesouraria), 5 * PRECO_POR_COTA);
    }

    function test_RF07_comprarCotas_revertSemKYC() public {
        moeda.mint(investidorNaoVerificado, 10_000_000e18);
        vm.prank(investidorNaoVerificado);
        moeda.approve(address(token), type(uint256).max);

        vm.prank(investidorNaoVerificado);
        vm.expectRevert(
            abi.encodeWithSelector(PropertyToken.ComplianceNaoVerificado.selector, "destino sem KYC verificado")
        );
        token.comprarCotas(1);
    }

    function test_RF09_comprarCotas_revertSeExcedeDisponivel() public {
        vm.prank(investidorVerificado);
        vm.expectRevert(abi.encodeWithSelector(PropertyToken.CotasIndisponiveis.selector, TOTAL_COTAS + 1, TOTAL_COTAS));
        token.comprarCotas(TOTAL_COTAS + 1);
    }

    function test_RF09_comprarCotas_permiteExatamenteOTotalDisponivel() public {
        vm.prank(investidorVerificado);
        token.comprarCotas(TOTAL_COTAS);

        assertEq(token.cotasDisponiveis(), 0);

        vm.prank(investidorVerificado);
        vm.expectRevert(abi.encodeWithSelector(PropertyToken.CotasIndisponiveis.selector, 1, 0));
        token.comprarCotas(1);
    }

    function test_comprarCotas_revertSeQuantidadeZero() public {
        vm.prank(investidorVerificado);
        vm.expectRevert(PropertyToken.QuantidadeInvalida.selector);
        token.comprarCotas(0);
    }

    /// Reentrancy em `comprarCotas` (contracts/property-token.md, SEC-01):
    /// uma moeda de pagamento maliciosa tenta reentrar durante o transferFrom.
    function test_comprarCotas_bloqueiaReentrancy() public {
        vm.startPrank(admin);
        MaliciousReentrantToken moedaMaliciosa = new MaliciousReentrantToken();
        PropertyToken tokenMalicioso = PropertyToken(Clones.clone(address(implementacao)));
        compliance.grantRole(compliance.TOKEN_ROLE(), address(tokenMalicioso));
        tokenMalicioso.inicializar(
            "Edificio Malicioso",
            TOTAL_COTAS,
            PRECO_POR_COTA,
            address(compliance),
            address(identityRegistry),
            address(moedaMaliciosa),
            tesouraria,
            admin
        );
        vm.stopPrank();

        moedaMaliciosa.mint(investidorVerificado, 10_000_000e18);
        vm.prank(investidorVerificado);
        moedaMaliciosa.approve(address(tokenMalicioso), type(uint256).max);
        moedaMaliciosa.configurarAtaque(tokenMalicioso);

        vm.prank(investidorVerificado);
        vm.expectRevert(); // ReentrancyGuardReentrantCall
        tokenMalicioso.comprarCotas(1);
    }

    function testFuzz_comprarCotas_quantidadesAleatorias(uint256 quantidade) public {
        quantidade = bound(quantidade, 1, TOTAL_COTAS);

        vm.prank(investidorVerificado);
        token.comprarCotas(quantidade);

        assertEq(token.balanceOf(investidorVerificado), quantidade);
        assertEq(token.totalSupply(), quantidade);
        assertLe(token.totalSupply(), TOTAL_COTAS);
        assertEq(token.totalSupply() + token.cotasDisponiveis(), TOTAL_COTAS);
    }

    // ---- transfer / transferFrom / compliance ----

    function test_transfer_respeitaComplianceModule() public {
        vm.prank(investidorVerificado);
        token.comprarCotas(10);

        vm.prank(investidorVerificado);
        vm.expectRevert(
            abi.encodeWithSelector(PropertyToken.ComplianceNaoVerificado.selector, "destino sem KYC verificado")
        );
        token.transfer(investidorNaoVerificado, 1);
    }

    function test_transfer_funcionaEntreVerificados() public {
        vm.prank(issuer);
        identityRegistry.emitirClaim(estranho, KYC_TOPIC, "assinatura-estranho");

        vm.prank(investidorVerificado);
        token.comprarCotas(10);

        vm.prank(investidorVerificado);
        token.transfer(estranho, 4);

        assertEq(token.balanceOf(investidorVerificado), 6);
        assertEq(token.balanceOf(estranho), 4);
    }

    function test_transfer_revertSeSaldoInsuficiente() public {
        vm.prank(investidorVerificado);
        token.comprarCotas(1);

        vm.prank(investidorVerificado);
        vm.expectRevert(abi.encodeWithSelector(PropertyToken.SaldoInsuficiente.selector, investidorVerificado, 2, 1));
        token.transfer(investidorVerificado, 2);
    }

    function test_transferFrom_respeitaAllowance() public {
        vm.prank(issuer);
        identityRegistry.emitirClaim(estranho, KYC_TOPIC, "assinatura-estranho");

        vm.prank(investidorVerificado);
        token.comprarCotas(10);

        vm.prank(investidorVerificado);
        token.approve(estranho, 5);

        vm.prank(estranho);
        token.transferFrom(investidorVerificado, estranho, 5);

        assertEq(token.allowance(investidorVerificado, estranho), 0);
        assertEq(token.balanceOf(estranho), 5);
    }

    function test_transferFrom_revertSeExcedeAllowance() public {
        vm.prank(investidorVerificado);
        token.comprarCotas(10);

        vm.prank(investidorVerificado);
        token.approve(estranho, 2);

        vm.prank(estranho);
        vm.expectRevert(
            abi.encodeWithSelector(PropertyToken.PermissaoInsuficiente.selector, investidorVerificado, estranho, 3, 2)
        );
        token.transferFrom(investidorVerificado, estranho, 3);
    }

    // ---- pausar / retomar ----

    function test_pausar_bloqueiaTransferencias() public {
        vm.prank(investidorVerificado);
        token.comprarCotas(10);

        vm.prank(admin);
        token.pausar();

        vm.prank(investidorVerificado);
        vm.expectRevert();
        token.comprarCotas(1);

        vm.prank(investidorVerificado);
        vm.expectRevert();
        token.transfer(estranho, 1);
    }

    function test_retomar_reabilitaTransferencias() public {
        vm.startPrank(admin);
        token.pausar();
        token.retomar();
        vm.stopPrank();

        vm.prank(investidorVerificado);
        token.comprarCotas(1);
        assertEq(token.balanceOf(investidorVerificado), 1);
    }

    function test_pausar_revertSeChamadorNaoForAdmin() public {
        bytes32 role = token.PLATFORM_ADMIN_ROLE();

        vm.prank(estranho);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, estranho, role)
        );
        token.pausar();
    }

    // ---- Snapshot (suporte a DividendDistributor, feature 003) ----
    //
    // A spec de DividendDistributor (contracts/dividend-distributor.md) exige um
    // snapshot dos saldos "inspirado em ERC20Snapshot" para o cálculo de RF-12,
    // sem que a feature 002 tivesse previsto isso. Adicionado aqui via
    // Checkpoints (OZ) — snapshot() é restrito a SNAPSHOT_ROLE, concedido ao
    // DividendDistributor de cada imóvel.

    function test_snapshot_apenasSnapshotRole() public {
        bytes32 role = token.SNAPSHOT_ROLE();

        vm.prank(estranho);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, estranho, role)
        );
        token.snapshot();
    }

    function test_snapshot_incrementaId() public {
        assertEq(token.currentSnapshotId(), 0);

        vm.prank(distribuidor);
        uint256 id1 = token.snapshot();
        assertEq(id1, 1);
        assertEq(token.currentSnapshotId(), 1);

        vm.prank(distribuidor);
        uint256 id2 = token.snapshot();
        assertEq(id2, 2);
        assertEq(token.currentSnapshotId(), 2);
    }

    function test_balanceOfAt_refleteSaldoNoMomentoDoSnapshot() public {
        vm.prank(investidorVerificado);
        token.comprarCotas(10);

        vm.prank(distribuidor);
        uint256 snapshotId = token.snapshot();

        assertEq(token.balanceOfAt(investidorVerificado, snapshotId), 10);
    }

    /// Cenário "Transferência de cota entre ciclos" (spec.md, feature 003):
    /// vender a cota após o snapshot não muda o saldo histórico daquele ciclo.
    function test_balanceOfAt_naoMudaComTransferenciasPosteriores() public {
        vm.prank(issuer);
        identityRegistry.emitirClaim(estranho, KYC_TOPIC, "assinatura-estranho");

        vm.prank(investidorVerificado);
        token.comprarCotas(10);

        vm.prank(distribuidor);
        uint256 snapshotId = token.snapshot();

        vm.prank(investidorVerificado);
        token.transfer(estranho, 10);

        assertEq(token.balanceOfAt(investidorVerificado, snapshotId), 10);
        assertEq(token.balanceOfAt(estranho, snapshotId), 0);
        assertEq(token.balanceOf(investidorVerificado), 0);
        assertEq(token.balanceOf(estranho), 10);
    }

    function test_balanceOfAt_refleteMudancasEntreSnapshotsDiferentes() public {
        vm.prank(investidorVerificado);
        token.comprarCotas(10);

        vm.prank(distribuidor);
        uint256 snapshot1 = token.snapshot();

        vm.prank(investidorVerificado);
        token.comprarCotas(5);

        vm.prank(distribuidor);
        uint256 snapshot2 = token.snapshot();

        assertEq(token.balanceOfAt(investidorVerificado, snapshot1), 10);
        assertEq(token.balanceOfAt(investidorVerificado, snapshot2), 15);
    }

    function test_balanceOfAt_revertSeSnapshotInvalido() public {
        vm.expectRevert(abi.encodeWithSelector(PropertyToken.SnapshotInvalido.selector, 0));
        token.balanceOfAt(investidorVerificado, 0);

        vm.expectRevert(abi.encodeWithSelector(PropertyToken.SnapshotInvalido.selector, 1));
        token.balanceOfAt(investidorVerificado, 1);
    }

    function test_balanceOfAt_zeroParaQuemNuncaTeveSaldoNoSnapshot() public {
        vm.prank(distribuidor);
        uint256 snapshotId = token.snapshot();

        assertEq(token.balanceOfAt(investidorVerificado, snapshotId), 0);
    }
}
