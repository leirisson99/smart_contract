// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
import {ComplianceModule} from "../src/ComplianceModule.sol";
import {PropertyToken} from "../src/PropertyToken.sol";
import {Marketplace} from "../src/Marketplace.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {FalsyPropertyToken} from "./mocks/FalsyPropertyToken.sol";

/// Testes de `Marketplace` — feature 004-mercado-secundario.
/// Escritos a partir de `spec.md` e `contracts/marketplace.md`. TDD
/// (specs/00-constitution.md): devem falhar (red) até `src/Marketplace.sol`
/// ser implementado.
///
/// Usa o `PropertyToken` real (não um mock) — a feature 002 já existe, então
/// este é também o teste de integração Marketplace + PropertyToken +
/// ComplianceModule pedido em test-strategy.md.
///
/// Passo de deploy necessário (spec não define): o próprio endereço do
/// `Marketplace` precisa de uma claim KYC_APPROVED no IdentityRegistry, pois
/// `listar`/`cancelar`/`comprar` movem cotas para/do escrow via
/// `transferFrom`/`transfer` normais do PropertyToken — sem atalho ao redor
/// da compliance (RISK-16/SEC-08) — e `canTransfer` exige que o destinatário
/// esteja verificado.
contract MarketplaceTest is Test {
    IdentityRegistry identityRegistry;
    ComplianceModule compliance;
    MockERC20 moeda;
    PropertyToken token;
    Marketplace marketplace;

    address admin = makeAddr("admin");
    address issuer = makeAddr("trustedIssuer");
    address tesouraria = makeAddr("tesouraria");
    address taxaTesouraria = makeAddr("taxaTesouraria");
    address vendedor = makeAddr("vendedor");
    address comprador = makeAddr("comprador");
    address compradorNaoVerificado = makeAddr("compradorNaoVerificado");
    address estranho = makeAddr("estranho");

    bytes32 constant KYC_TOPIC = keccak256("KYC_APPROVED");

    uint256 constant TOTAL_COTAS = 1_000;
    uint256 constant PRECO_POR_COTA = 10_000e18;
    uint256 constant TAXA_INICIAL_BPS = 100; // 1%

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

        marketplace = new Marketplace(taxaTesouraria, TAXA_INICIAL_BPS);
        vm.stopPrank();

        vm.startPrank(issuer);
        identityRegistry.emitirClaim(address(marketplace), KYC_TOPIC, "assinatura-marketplace");
        identityRegistry.emitirClaim(vendedor, KYC_TOPIC, "assinatura-vendedor");
        identityRegistry.emitirClaim(comprador, KYC_TOPIC, "assinatura-comprador");
        vm.stopPrank();

        moeda.mint(vendedor, 10_000_000e18);
        vm.prank(vendedor);
        moeda.approve(address(token), type(uint256).max);
        vm.prank(vendedor);
        token.comprarCotas(100);

        vm.prank(vendedor);
        token.approve(address(marketplace), type(uint256).max);

        moeda.mint(comprador, 10_000_000e18);
        vm.prank(comprador);
        moeda.approve(address(marketplace), type(uint256).max);

        moeda.mint(compradorNaoVerificado, 10_000_000e18);
        vm.prank(compradorNaoVerificado);
        moeda.approve(address(marketplace), type(uint256).max);
    }

    // ---- RF-16: listagem / escrow ----

    function test_RF16_listar_colocaCotasEmEscrow() public {
        vm.expectEmit(true, true, true, true);
        emit Marketplace.ListagemCriada(1, vendedor, address(token), 10, PRECO_POR_COTA);

        vm.prank(vendedor);
        uint256 idListagem = marketplace.listar(address(token), 10, PRECO_POR_COTA);

        assertEq(idListagem, 1);
        assertEq(token.balanceOf(vendedor), 90);
        assertEq(token.balanceOf(address(marketplace)), 10);

        (address v, address pt, uint256 qtd, uint256 preco, bool ativa) = marketplace.listagem(1);
        assertEq(v, vendedor);
        assertEq(pt, address(token));
        assertEq(qtd, 10);
        assertEq(preco, PRECO_POR_COTA);
        assertTrue(ativa);
    }

    function test_listar_revertSeQuantidadeZero() public {
        vm.prank(vendedor);
        vm.expectRevert(Marketplace.QuantidadeInvalida.selector);
        marketplace.listar(address(token), 0, PRECO_POR_COTA);
    }

    function test_listar_revertSePrecoZero() public {
        vm.prank(vendedor);
        vm.expectRevert(Marketplace.PrecoInvalido.selector);
        marketplace.listar(address(token), 10, 0);
    }

    // ---- RF-17: compra total/parcial ----

    function test_RF17_comprar_transfereCotasEPagamento() public {
        vm.prank(vendedor);
        uint256 idListagem = marketplace.listar(address(token), 10, PRECO_POR_COTA);

        uint256 valorTotal = 10 * PRECO_POR_COTA;
        uint256 taxaEsperada = (valorTotal * TAXA_INICIAL_BPS) / 10_000;
        uint256 valorLiquidoEsperado = valorTotal - taxaEsperada;

        uint256 saldoVendedorAntes = moeda.balanceOf(vendedor);

        vm.expectEmit(true, true, false, true);
        emit Marketplace.CompraExecutada(idListagem, comprador, 10, valorTotal, taxaEsperada);

        vm.prank(comprador);
        marketplace.comprar(idListagem, 10);

        assertEq(token.balanceOf(comprador), 10);
        assertEq(token.balanceOf(address(marketplace)), 0);
        assertEq(moeda.balanceOf(vendedor) - saldoVendedorAntes, valorLiquidoEsperado);
        assertEq(moeda.balanceOf(taxaTesouraria), taxaEsperada);

        (,,,, bool ativa) = marketplace.listagem(idListagem);
        assertFalse(ativa);
    }

    function test_RF17_comprarParcial_mantemListagemAtiva() public {
        vm.prank(vendedor);
        uint256 idListagem = marketplace.listar(address(token), 10, PRECO_POR_COTA);

        vm.prank(comprador);
        marketplace.comprar(idListagem, 4);

        assertEq(token.balanceOf(comprador), 4);
        (,, uint256 qtdDisponivel,, bool ativa) = marketplace.listagem(idListagem);
        assertEq(qtdDisponivel, 6);
        assertTrue(ativa);
    }

    function test_RF20_comprar_revertSemKYC() public {
        vm.prank(vendedor);
        uint256 idListagem = marketplace.listar(address(token), 10, PRECO_POR_COTA);

        vm.prank(compradorNaoVerificado);
        vm.expectRevert(
            abi.encodeWithSelector(PropertyToken.ComplianceNaoVerificado.selector, "destino sem KYC verificado")
        );
        marketplace.comprar(idListagem, 1);
    }

    function test_comprar_revertSeExcedeQuantidadeDisponivel() public {
        vm.prank(vendedor);
        uint256 idListagem = marketplace.listar(address(token), 10, PRECO_POR_COTA);

        vm.prank(comprador);
        vm.expectRevert(abi.encodeWithSelector(Marketplace.QuantidadeIndisponivel.selector, 11, 10));
        marketplace.comprar(idListagem, 11);
    }

    function test_comprar_revertSeListagemInativa() public {
        vm.prank(vendedor);
        uint256 idListagem = marketplace.listar(address(token), 10, PRECO_POR_COTA);

        vm.prank(vendedor);
        marketplace.cancelar(idListagem);

        vm.prank(comprador);
        vm.expectRevert(abi.encodeWithSelector(Marketplace.ListagemInativa.selector, idListagem));
        marketplace.comprar(idListagem, 1);
    }

    /// Duas compras concorrentes na mesma listagem (test-strategy.md): a
    /// primeira consome a quantidade disponível; a segunda ajusta para o
    /// restante ou reverte se nada restar.
    function test_duasComprasSequenciaisNaMesmaListagem_segundaAjustaAoRestante() public {
        vm.prank(vendedor);
        uint256 idListagem = marketplace.listar(address(token), 10, PRECO_POR_COTA);

        address comprador2 = makeAddr("comprador2");
        vm.prank(issuer);
        identityRegistry.emitirClaim(comprador2, KYC_TOPIC, "assinatura-comprador2");
        moeda.mint(comprador2, 10_000_000e18);
        vm.prank(comprador2);
        moeda.approve(address(marketplace), type(uint256).max);

        vm.prank(comprador);
        marketplace.comprar(idListagem, 7);

        vm.prank(comprador2);
        vm.expectRevert(abi.encodeWithSelector(Marketplace.QuantidadeIndisponivel.selector, 5, 3));
        marketplace.comprar(idListagem, 5);

        vm.prank(comprador2);
        marketplace.comprar(idListagem, 3);

        assertEq(token.balanceOf(comprador), 7);
        assertEq(token.balanceOf(comprador2), 3);
        (,,,, bool ativa) = marketplace.listagem(idListagem);
        assertFalse(ativa);
    }

    // ---- RF-18: cancelamento ----

    function test_RF18_cancelar_devolveCotasAoVendedor() public {
        vm.prank(vendedor);
        uint256 idListagem = marketplace.listar(address(token), 10, PRECO_POR_COTA);

        vm.expectEmit(true, false, false, false);
        emit Marketplace.ListagemCancelada(idListagem);

        vm.prank(vendedor);
        marketplace.cancelar(idListagem);

        assertEq(token.balanceOf(vendedor), 100);
        assertEq(token.balanceOf(address(marketplace)), 0);

        (,,,, bool ativa) = marketplace.listagem(idListagem);
        assertFalse(ativa);
    }

    function test_RF18_cancelar_revertSeNaoDono() public {
        vm.prank(vendedor);
        uint256 idListagem = marketplace.listar(address(token), 10, PRECO_POR_COTA);

        vm.prank(estranho);
        vm.expectRevert(abi.encodeWithSelector(Marketplace.NaoAutorizado.selector, estranho, idListagem));
        marketplace.cancelar(idListagem);
    }

    function test_cancelar_revertSeJaCancelada() public {
        vm.prank(vendedor);
        uint256 idListagem = marketplace.listar(address(token), 10, PRECO_POR_COTA);

        vm.prank(vendedor);
        marketplace.cancelar(idListagem);

        vm.prank(vendedor);
        vm.expectRevert(abi.encodeWithSelector(Marketplace.ListagemInativa.selector, idListagem));
        marketplace.cancelar(idListagem);
    }

    // ---- Taxa de transação ----

    function test_taxaTransacao_cobradaCorretamente() public {
        vm.prank(admin);
        marketplace.definirTaxaTransacao(200); // 2%

        vm.prank(vendedor);
        uint256 idListagem = marketplace.listar(address(token), 10, PRECO_POR_COTA);

        uint256 valorTotal = 10 * PRECO_POR_COTA;
        uint256 taxaEsperada = (valorTotal * 200) / 10_000;

        vm.prank(comprador);
        marketplace.comprar(idListagem, 10);

        assertEq(moeda.balanceOf(taxaTesouraria), taxaEsperada);
        assertEq(marketplace.taxaTransacao(), 200);
    }

    function test_definirTaxaTransacao_revertSeChamadorNaoForAdmin() public {
        bytes32 role = marketplace.PLATFORM_ADMIN_ROLE();

        vm.prank(estranho);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, estranho, role)
        );
        marketplace.definirTaxaTransacao(200);
    }

    function test_definirTaxaTransacao_revertSeExcede100Porcento() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(Marketplace.TaxaInvalida.selector, 10_001));
        marketplace.definirTaxaTransacao(10_001);
    }

    function test_constructor_revertSeTaxaInicialExcede100Porcento() public {
        vm.expectRevert(abi.encodeWithSelector(Marketplace.TaxaInvalida.selector, 10_001));
        new Marketplace(taxaTesouraria, 10_001);
    }

    function test_constructor_revertSeTaxaTesourariaZero() public {
        vm.expectRevert(Marketplace.EnderecoInvalido.selector);
        new Marketplace(address(0), 100);
    }

    // ---- Hardening (Sprint 4 / Slither unchecked-transfer) ----
    //
    // O `PropertyToken` real nunca retorna `false` em transfer/transferFrom
    // (todo caminho de falha reverte), então os `require`s abaixo não são
    // alcançáveis com o contrato real. Usamos um dublê (`FalsyPropertyToken`)
    // que devolve `false` em vez de reverter, só para provar que o
    // `Marketplace` trata esse caso defensivamente.

    function test_listar_revertSeTransferFromRetornaFalse() public {
        FalsyPropertyToken falsy = new FalsyPropertyToken(moeda);
        falsy.configurarRetornos(false, true);

        vm.prank(vendedor);
        vm.expectRevert(Marketplace.TransferenciaFalhou.selector);
        marketplace.listar(address(falsy), 10, PRECO_POR_COTA);
    }

    function test_cancelar_revertSeTransferRetornaFalse() public {
        FalsyPropertyToken falsy = new FalsyPropertyToken(moeda);

        vm.prank(vendedor);
        uint256 idListagem = marketplace.listar(address(falsy), 10, PRECO_POR_COTA);

        falsy.configurarRetornos(true, false);

        vm.prank(vendedor);
        vm.expectRevert(Marketplace.TransferenciaFalhou.selector);
        marketplace.cancelar(idListagem);
    }

    function test_comprar_revertSeTransferRetornaFalse() public {
        FalsyPropertyToken falsy = new FalsyPropertyToken(moeda);

        vm.prank(vendedor);
        uint256 idListagem = marketplace.listar(address(falsy), 10, PRECO_POR_COTA);

        falsy.configurarRetornos(true, false);

        vm.prank(comprador);
        vm.expectRevert(Marketplace.TransferenciaFalhou.selector);
        marketplace.comprar(idListagem, 5);
    }

    // ---- Leitura ----

    function test_listagensAtivasPorToken_retornaSoAsAtivas() public {
        vm.startPrank(vendedor);
        uint256 id1 = marketplace.listar(address(token), 5, PRECO_POR_COTA);
        uint256 id2 = marketplace.listar(address(token), 5, PRECO_POR_COTA);
        vm.stopPrank();

        vm.prank(vendedor);
        marketplace.cancelar(id1);

        uint256[] memory ativas = marketplace.listagensAtivasPorToken(address(token));
        assertEq(ativas.length, 1);
        assertEq(ativas[0], id2);
    }

    // ---- Fuzz ----

    function testFuzz_listar_precosEQuantidadesAleatorias(uint256 quantidade, uint256 preco) public {
        quantidade = bound(quantidade, 1, 100);
        preco = bound(preco, 1, 1_000_000e18);

        vm.prank(vendedor);
        uint256 idListagem = marketplace.listar(address(token), quantidade, preco);

        (,, uint256 qtdDisponivel, uint256 precoArmazenado,) = marketplace.listagem(idListagem);
        assertEq(qtdDisponivel, quantidade);
        assertEq(precoArmazenado, preco);
    }

    function testFuzz_comprar_quantidadesAleatorias(uint256 quantidadeListada, uint256 quantidadeComprada) public {
        quantidadeListada = bound(quantidadeListada, 1, 100);
        quantidadeComprada = bound(quantidadeComprada, 1, quantidadeListada);

        vm.prank(vendedor);
        uint256 idListagem = marketplace.listar(address(token), quantidadeListada, PRECO_POR_COTA);

        vm.prank(comprador);
        marketplace.comprar(idListagem, quantidadeComprada);

        assertEq(token.balanceOf(comprador), quantidadeComprada);
        (,, uint256 qtdDisponivel,,) = marketplace.listagem(idListagem);
        assertEq(qtdDisponivel, quantidadeListada - quantidadeComprada);
    }
}
