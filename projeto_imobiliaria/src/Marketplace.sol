// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {PropertyToken} from "./PropertyToken.sol";

/// @notice Mercado secundário a preço fixo (RNF-09 — sem order book/leilão),
/// compartilhado entre todos os imóveis da plataforma e parametrizado pelo
/// endereço do `PropertyToken` em cada listagem. Cotas listadas ficam em
/// escrow neste contrato até venda ou cancelamento.
///
/// Não duplica nenhuma checagem de compliance: toda movimentação de cota usa
/// `transfer`/`transferFrom` normais do `PropertyToken`, que já aplicam
/// `ComplianceModule.canTransfer` (RISK-16/SEC-08 — a segurança vem do
/// `PropertyToken` recusar qualquer transferência, não de um caminho
/// especial no Marketplace). Consequência: o próprio endereço deste contrato
/// precisa de uma claim KYC_APPROVED no `IdentityRegistry` para poder
/// receber/manter cotas em escrow — passo de deploy, não código.
contract Marketplace is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant PLATFORM_ADMIN_ROLE = keccak256("PLATFORM_ADMIN_ROLE");
    uint256 public constant BPS_DENOMINADOR = 10_000;

    struct Listagem {
        address vendedor;
        address propertyToken;
        uint256 quantidadeDisponivel;
        uint256 precoPorCota;
        bool ativa;
    }

    address public immutable taxaTesouraria;
    uint256 public taxaTransacaoBps;

    uint256 private _proximoIdListagem;
    mapping(uint256 idListagem => Listagem) private _listagens;
    mapping(address propertyToken => uint256[] idsListagem) private _listagensPorToken;

    event ListagemCriada(
        uint256 indexed idListagem,
        address indexed vendedor,
        address indexed propertyToken,
        uint256 quantidade,
        uint256 precoPorCota
    );
    event ListagemCancelada(uint256 indexed idListagem);
    event CompraExecutada(
        uint256 indexed idListagem,
        address indexed comprador,
        uint256 quantidade,
        uint256 valorPago,
        uint256 taxaCobrada
    );
    event TaxaTransacaoDefinida(uint256 taxaBps);

    error QuantidadeInvalida();
    error PrecoInvalido();
    error NaoAutorizado(address chamador, uint256 idListagem);
    error ListagemInativa(uint256 idListagem);
    error QuantidadeIndisponivel(uint256 solicitado, uint256 disponivel);
    error TaxaInvalida(uint256 taxaBps);
    error EnderecoInvalido();
    error TransferenciaFalhou();

    constructor(address taxaTesouraria_, uint256 taxaTransacaoBpsInicial) {
        if (taxaTesouraria_ == address(0)) revert EnderecoInvalido();
        if (taxaTransacaoBpsInicial > BPS_DENOMINADOR) revert TaxaInvalida(taxaTransacaoBpsInicial);
        taxaTesouraria = taxaTesouraria_;
        taxaTransacaoBps = taxaTransacaoBpsInicial;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PLATFORM_ADMIN_ROLE, msg.sender);
    }

    // ---- RF-16: listagem ----

    function listar(address propertyToken, uint256 quantidade, uint256 precoPorCota)
        external
        nonReentrant
        returns (uint256 idListagem)
    {
        if (quantidade == 0) revert QuantidadeInvalida();
        if (precoPorCota == 0) revert PrecoInvalido();

        _proximoIdListagem += 1;
        idListagem = _proximoIdListagem;

        _listagens[idListagem] = Listagem({
            vendedor: msg.sender,
            propertyToken: propertyToken,
            quantidadeDisponivel: quantidade,
            precoPorCota: precoPorCota,
            ativa: true
        });
        _listagensPorToken[propertyToken].push(idListagem);

        bool sucesso = PropertyToken(propertyToken).transferFrom(msg.sender, address(this), quantidade);
        if (!sucesso) revert TransferenciaFalhou();

        emit ListagemCriada(idListagem, msg.sender, propertyToken, quantidade, precoPorCota);
    }

    // ---- RF-18: cancelamento ----

    function cancelar(uint256 idListagem) external nonReentrant {
        Listagem storage l = _listagens[idListagem];
        if (l.vendedor != msg.sender) revert NaoAutorizado(msg.sender, idListagem);
        if (!l.ativa) revert ListagemInativa(idListagem);

        uint256 quantidade = l.quantidadeDisponivel;
        l.ativa = false;
        l.quantidadeDisponivel = 0;

        bool sucesso = PropertyToken(l.propertyToken).transfer(msg.sender, quantidade);
        if (!sucesso) revert TransferenciaFalhou();

        emit ListagemCancelada(idListagem);
    }

    // ---- RF-17 / RF-19 / RF-20: compra ----

    function comprar(uint256 idListagem, uint256 quantidade) external nonReentrant {
        Listagem storage l = _listagens[idListagem];
        if (!l.ativa) revert ListagemInativa(idListagem);
        if (quantidade == 0 || quantidade > l.quantidadeDisponivel) {
            revert QuantidadeIndisponivel(quantidade, l.quantidadeDisponivel);
        }

        uint256 valorTotal = l.precoPorCota * quantidade;
        uint256 taxa = (valorTotal * taxaTransacaoBps) / BPS_DENOMINADOR;
        uint256 valorLiquido = valorTotal - taxa;

        address vendedor = l.vendedor;
        address propertyToken = l.propertyToken;

        // Effects antes de qualquer chamada externa (CEI, SEC-01).
        l.quantidadeDisponivel -= quantidade;
        if (l.quantidadeDisponivel == 0) {
            l.ativa = false;
        }

        IERC20 moeda = PropertyToken(propertyToken).moedaPagamento();
        moeda.safeTransferFrom(msg.sender, vendedor, valorLiquido);
        if (taxa > 0) {
            moeda.safeTransferFrom(msg.sender, taxaTesouraria, taxa);
        }

        // Passa pelo transfer normal do PropertyToken — mesma checagem de
        // compliance da emissão primária (RF-19, RISK-16, SEC-08).
        bool sucesso = PropertyToken(propertyToken).transfer(msg.sender, quantidade);
        if (!sucesso) revert TransferenciaFalhou();

        emit CompraExecutada(idListagem, msg.sender, quantidade, valorTotal, taxa);
    }

    // ---- Administração ----

    function definirTaxaTransacao(uint256 taxaBps) external onlyRole(PLATFORM_ADMIN_ROLE) {
        if (taxaBps > BPS_DENOMINADOR) revert TaxaInvalida(taxaBps);
        taxaTransacaoBps = taxaBps;
        emit TaxaTransacaoDefinida(taxaBps);
    }

    // ---- Leitura ----

    function listagem(uint256 idListagem)
        external
        view
        returns (
            address vendedor,
            address propertyToken,
            uint256 quantidadeDisponivel,
            uint256 precoPorCota,
            bool ativa
        )
    {
        Listagem storage l = _listagens[idListagem];
        return (l.vendedor, l.propertyToken, l.quantidadeDisponivel, l.precoPorCota, l.ativa);
    }

    function taxaTransacao() external view returns (uint256) {
        return taxaTransacaoBps;
    }

    function listagensAtivasPorToken(address propertyToken) external view returns (uint256[] memory) {
        uint256[] storage idsDoToken = _listagensPorToken[propertyToken];
        uint256 total = idsDoToken.length;

        uint256 contagem = 0;
        for (uint256 i = 0; i < total; i++) {
            if (_listagens[idsDoToken[i]].ativa) contagem++;
        }

        uint256[] memory ativas = new uint256[](contagem);
        uint256 indice = 0;
        for (uint256 i = 0; i < total; i++) {
            uint256 id = idsDoToken[i];
            if (_listagens[id].ativa) {
                ativas[indice] = id;
                indice++;
            }
        }
        return ativas;
    }
}
