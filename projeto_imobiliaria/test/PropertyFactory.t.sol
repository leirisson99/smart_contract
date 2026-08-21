// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
import {ComplianceModule} from "../src/ComplianceModule.sol";
import {PropertyToken} from "../src/PropertyToken.sol";
import {PropertyFactory} from "../src/PropertyFactory.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

/// Testes de `PropertyFactory` — feature 002-tokenizacao-imovel.
/// Escritos a partir de `contracts/property-factory.md` e `test-strategy.md`.
/// TDD (specs/00-constitution.md): devem falhar (red) até
/// `src/PropertyFactory.sol` ser implementado.
///
/// A Factory precisa de DEFAULT_ADMIN_ROLE no ComplianceModule para poder
/// conceder TOKEN_ROLE a cada novo PropertyToken que cria — um detalhe de
/// integração que a spec ("sem código") não define; documentado em
/// PENDENCIAS.md/PROGRESS.md como passo de deploy.
contract PropertyFactoryTest is Test {
    IdentityRegistry identityRegistry;
    ComplianceModule compliance;
    MockERC20 moeda;
    PropertyToken implementacao;
    PropertyFactory factory;

    address admin = makeAddr("admin");
    address tesouraria = makeAddr("tesouraria");
    address estranho = makeAddr("estranho");

    function setUp() public {
        vm.startPrank(admin);
        identityRegistry = new IdentityRegistry();
        compliance = new ComplianceModule(identityRegistry);
        moeda = new MockERC20("Stablecoin Mock", "mBRZ");
        implementacao = new PropertyToken();

        factory = new PropertyFactory(identityRegistry, compliance, address(moeda), tesouraria, address(implementacao));

        // Passo de deploy necessário: a Factory precisa poder conceder TOKEN_ROLE
        // a cada PropertyToken que criar.
        compliance.grantRole(compliance.DEFAULT_ADMIN_ROLE(), address(factory));
        vm.stopPrank();
    }

    // ---- RF-06: criação de imóvel ----

    function test_RF06_criarImovel_deployaPropertyTokenCorreto() public {
        vm.prank(admin);
        address propertyToken = factory.criarImovel("Edificio X", 10_000_000e18, 1_000);

        PropertyToken token = PropertyToken(propertyToken);
        assertEq(token.nome(), "Edificio X");
        assertEq(token.totalCotas(), 1_000);
        assertEq(token.precoPorCota(), 10_000e18);
        assertEq(address(token.complianceModule()), address(compliance));
        assertEq(address(token.identityRegistry()), address(identityRegistry));
        assertEq(address(token.moedaPagamento()), address(moeda));
        assertEq(token.tesouraria(), tesouraria);
        assertTrue(token.hasRole(token.PLATFORM_ADMIN_ROLE(), admin));

        address[] memory lista = factory.imoveis();
        assertEq(lista.length, 1);
        assertEq(lista[0], propertyToken);
        assertEq(factory.imovelPorId(0), propertyToken);
    }

    function test_RF06_criarImovel_emiteEvento() public {
        vm.expectEmit(true, false, false, false);
        emit PropertyFactory.ImovelCriado(0, address(0), "Edificio X", 10_000_000e18, 1_000);

        vm.prank(admin);
        factory.criarImovel("Edificio X", 10_000_000e18, 1_000);
    }

    function test_RF06_criarImovel_revertSeNaoAdmin() public {
        bytes32 role = factory.PLATFORM_ADMIN_ROLE();

        vm.prank(estranho);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, estranho, role)
        );
        factory.criarImovel("Edificio X", 10_000_000e18, 1_000);
    }

    function test_criarImovel_revertSeValorNaoDivisivelPorCotas() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(PropertyFactory.ValorNaoDivisivelPorCotas.selector, 100, 3));
        factory.criarImovel("Edificio X", 100, 3);
    }

    function test_criarImovel_revertSeNumeroCotasZero() public {
        vm.prank(admin);
        vm.expectRevert(PropertyFactory.NumeroCotasInvalido.selector);
        factory.criarImovel("Edificio X", 100, 0);
    }

    function test_criarImovel_doisImoveisCompartilhamIdentityEComplianceMasNaoSaldo() public {
        vm.startPrank(admin);
        address imovel1 = factory.criarImovel("Edificio 1", 10_000_000e18, 1_000);
        address imovel2 = factory.criarImovel("Edificio 2", 5_000_000e18, 500);
        vm.stopPrank();

        assertTrue(imovel1 != imovel2);
        assertEq(address(PropertyToken(imovel1).identityRegistry()), address(identityRegistry));
        assertEq(address(PropertyToken(imovel2).identityRegistry()), address(identityRegistry));

        address[] memory lista = factory.imoveis();
        assertEq(lista.length, 2);
    }

    function testFuzz_criarImovel_valoresECotasAleatorios(uint256 numeroCotas, uint256 precoPorCota) public {
        numeroCotas = bound(numeroCotas, 1, 1_000_000);
        precoPorCota = bound(precoPorCota, 1, 1_000_000e18);
        uint256 valorTotal = numeroCotas * precoPorCota;

        vm.prank(admin);
        address propertyToken = factory.criarImovel("Edificio Fuzz", valorTotal, numeroCotas);

        PropertyToken token = PropertyToken(propertyToken);
        assertEq(token.totalCotas(), numeroCotas);
        assertEq(token.precoPorCota(), precoPorCota);
    }
}
